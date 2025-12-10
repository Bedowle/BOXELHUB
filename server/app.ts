import { type Server } from "node:http";

import express, {
    type Express,
    type Request,
    Response,
    NextFunction,
} from "express";
import session from "express-session";
import createPgSession from "connect-pg-simple";

import { registerRoutes } from "./routes";
import { WebhookHandlers } from "./webhookHandlers";
import { pool } from "./db";
import MemoryStore from "memorystore";

export function log(message: string, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
    interface IncomingMessage {
        rawBody: unknown
    }
}

// Initialize session store - use memory in dev, PostgreSQL in production
let sessionStore: any;

if (process.env.NODE_ENV === 'production') {
    const PgSession = createPgSession(session);
    sessionStore = new PgSession({
        pool,
        tableName: "sessions",
    });
} else {
    const MemStoreSession = MemoryStore(session);
    sessionStore = new MemStoreSession({
        checkPeriod: 86400000, // 24 hours
    });
}

// Register Stripe webhook route BEFORE express.json()
app.post(
    '/api/stripe/webhook/:uuid',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        const signature = req.headers['stripe-signature'];

        if (!signature) {
            return res.status(400).json({ error: 'Missing stripe-signature' });
        }

        try {
            const sig = Array.isArray(signature) ? signature[0] : signature;

            if (!Buffer.isBuffer(req.body)) {
                const errorMsg = 'STRIPE WEBHOOK ERROR: req.body is not a Buffer.';
                console.error(errorMsg);
                return res.status(500).json({ error: 'Webhook processing error' });
            }

            const { uuid } = req.params;
            await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

            res.status(200).json({ received: true });
        } catch (error: any) {
            console.error('Webhook error:', error.message);
            res.status(400).json({ error: 'Webhook processing error' });
        }
    }
);

// Session middleware - MUST come before routes
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is required");
}

// AÑADIDO: Configuración de proxy para Express. Obligatorio en Render.
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(session({
    store: sessionStore,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        // La cookie debe ser segura (secure: true) si estás en producción
        secure: process.env.NODE_ENV === 'production',
        // Usamos 'none' en producción para permitir que la cookie se envíe correctamente
        // cuando el frontend y el backend están en subdominios diferentes (típico de Render)
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// AUMENTO DEL LÍMITE DE TAMAÑO DEL CUERPO (BODY SIZE) A 200MB
app.use(express.json({
    limit: "200mb", // Límite aumentado
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: false, limit: "200mb" })); // Límite aumentado

app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }

            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }

            log(logLine);
        }
    });

    next();
});

export default async function runApp(
    setup: (app: Express, server: Server) => Promise<void>,
) {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        // Registra el error antes de responder, pero NO lo lanza de nuevo.
        console.error("Caught error in global handler:", err); 

        res.status(status).json({ message });
        // IMPORTANTE: Se eliminó 'throw err;' para evitar que el servidor colapse.
    });

    // importantly run the final setup after setting up all the other routes so
    // the catch-all route doesn't interfere with the other routes
    await setup(app, server);

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
    }, () => {
        log(`serving on port ${port}`);
    });
}
