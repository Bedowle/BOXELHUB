import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import ClientRegisterForm from "@/components/ClientRegisterForm";
import MakerRegisterForm from "@/components/MakerRegisterForm";
import LoginForm from "@/components/LoginForm";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const [view, setView] = useState<"login" | "register-client" | "register-maker" | "forgot-password">("login");
  const [redirectTo, setRedirectTo] = useState<string>("/");

  // Auto-set view from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get("type");
    const redirectParam = params.get("redirectTo");
    
    if (redirectParam) {
      setRedirectTo(redirectParam);
    }
    
    if (typeParam === "maker") {
      setView("register-maker");
    } else if (typeParam === "client") {
      setView("register-client");
    } else {
      setView("login");
    }
  }, []);

  const handleBackToLanding = () => {
    setLocation(redirectTo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary">

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <Card className="shadow-2xl border-0 p-8 min-h-full">
          {/* LOGIN MODE */}
          {view === "login" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Bienvenido</h2>
                <p className="text-muted-foreground text-sm">
                  Inicia sesión en tu cuenta
                </p>
              </div>

              <LoginForm 
                onSuccess={() => setLocation(redirectTo)}
                onForgotPassword={() => setView("forgot-password")}
              />

              <div className="text-center text-sm">
                ¿No tienes cuenta?{" "}
                <button
                  onClick={() => setLocation("/auth?type=client")}
                  className="text-primary font-semibold hover:underline"
                  data-testid="button-switch-register"
                >
                  Registrarse
                </button>
              </div>

            </div>
          )}

          {/* REGISTER - CLIENT FORM */}
          {view === "register-client" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToLanding}
                  data-testid="button-back-client-form"
                >
                  ←
                </Button>
                <h2 className="text-2xl font-bold">Registro - Cliente</h2>
              </div>
              <ClientRegisterForm
                onSuccess={() => setLocation(redirectTo)}
                onBack={handleBackToLanding}
              />
              
              <div className="text-center text-sm border-t pt-4">
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => setLocation("/auth")}
                  className="text-primary font-semibold hover:underline"
                  data-testid="button-login-from-client-register"
                >
                  Inicia Sesión
                </button>
              </div>
            </div>
          )}

          {/* REGISTER - MAKER FORM */}
          {view === "register-maker" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToLanding}
                  data-testid="button-back-maker-form"
                >
                  ←
                </Button>
                <h2 className="text-2xl font-bold">Registro - Maker</h2>
              </div>
              <MakerRegisterForm
                onSuccess={() => setLocation(redirectTo)}
                onBack={handleBackToLanding}
              />
              
              <div className="text-center text-sm border-t pt-4">
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => setLocation("/auth")}
                  className="text-primary font-semibold hover:underline"
                  data-testid="button-login-from-maker-register"
                >
                  Inicia Sesión
                </button>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD MODE */}
          {view === "forgot-password" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Recuperar Contraseña</h2>
                <p className="text-muted-foreground text-sm">
                  Te enviaremos un link al email
                </p>
              </div>

              <ForgotPasswordForm onBack={() => setView("login")} />
            </div>
          )}
          </Card>
        </div>
      </div>
    </div>
  );
}
