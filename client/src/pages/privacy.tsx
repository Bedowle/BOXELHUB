import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 max-w-7xl flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Política de Privacidad</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Recopilación de Datos</h2>
            <p>
              VoxelHub recopila información personal cuando te registras, usas nuestros servicios,
              y realizas transacciones. Esta información incluye nombre, email, datos de pago y archivos STL.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. Uso de Información</h2>
            <p>
              Utilizamos tu información para:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Procesar transacciones</li>
              <li>Enviar actualizaciones y notificaciones</li>
              <li>Mejorar nuestros servicios</li>
              <li>Proteger contra fraude</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. Protección de Datos</h2>
            <p>
              VoxelHub implementa medidas de seguridad avanzadas para proteger tu información.
              Todos los datos se cifran y se almacenan en servidores seguros.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Compartir Información</h2>
            <p>
              No compartimos tu información personal con terceros sin tu consentimiento, excepto
              cuando es necesario para procesar pagos o cumplir con la ley.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Derechos del Usuario</h2>
            <p>
              Tienes derecho a acceder, modificar o eliminar tu información personal en cualquier momento.
              Contáctanos para solicitar estos cambios.
            </p>
          </section>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8">
            <p className="text-sm">
              Última actualización: Noviembre 2024
            </p>
            <p className="text-sm mt-2">
              Si tienes preguntas sobre esta política, contáctanos en support@voxelhub.com
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
