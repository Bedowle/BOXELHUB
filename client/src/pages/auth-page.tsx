import { useState } from "react";
import { useLocation } from "wouter";
import ClientRegisterForm from "@/components/ClientRegisterForm";
import MakerRegisterForm from "@/components/MakerRegisterForm";
import LoginForm from "@/components/LoginForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [userType, setUserType] = useState<"client" | "maker" | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center p-4">
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-white hover:bg-white/10"
        onClick={() => setLocation("/")}
        data-testid="button-logo-auth"
      >
        <span className="text-lg font-bold">VoxelHub</span>
        <span className="ml-1">◼</span>
      </Button>

      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 p-8">
          {/* LOGIN MODE */}
          {mode === "login" && !userType && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Bienvenido</h2>
                <p className="text-muted-foreground text-sm">
                  Inicia sesión en tu cuenta
                </p>
              </div>

              <LoginForm onSuccess={() => setLocation("/")} />

              <div className="text-center text-sm">
                ¿No tienes cuenta?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="text-primary font-semibold hover:underline"
                  data-testid="button-switch-register"
                >
                  Registrarse
                </button>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setLocation("/")}
                data-testid="button-back-to-landing"
              >
                Volver a inicio
              </Button>
            </div>
          )}

          {/* REGISTER - CHOOSE TYPE */}
          {mode === "register" && !userType && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Crear Cuenta</h2>
                <p className="text-muted-foreground text-sm">
                  ¿Qué eres?
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setUserType("client")}
                  size="lg"
                  data-testid="button-client-register-choice"
                >
                  Soy Cliente - Necesito Impresión
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setUserType("maker")}
                  size="lg"
                  data-testid="button-maker-register-choice"
                >
                  Soy Maker - Ofrezco Impresión
                </Button>
              </div>

              <div className="text-center text-sm border-t pt-4">
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-primary font-semibold hover:underline"
                  data-testid="button-switch-login"
                >
                  Inicia Sesión
                </button>
              </div>
            </div>
          )}

          {/* REGISTER - CLIENT FORM */}
          {mode === "register" && userType === "client" && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Registro - Cliente</h2>
              </div>
              <ClientRegisterForm
                onSuccess={() => setLocation("/")}
                onBack={() => setUserType(null)}
              />
            </div>
          )}

          {/* REGISTER - MAKER FORM */}
          {mode === "register" && userType === "maker" && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Registro - Maker</h2>
              </div>
              <MakerRegisterForm
                onSuccess={() => setLocation("/")}
                onBack={() => setUserType(null)}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
