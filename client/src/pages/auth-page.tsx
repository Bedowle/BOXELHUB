import { useState } from "react";
import { useLocation } from "wouter";
import ClientRegisterForm from "@/components/ClientRegisterForm";
import MakerRegisterForm from "@/components/MakerRegisterForm";
import LoginForm from "@/components/LoginForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <Card className="shadow-2xl border-0">
          {!userType ? (
            // User type selection
            <div className="p-8 text-center space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Bienvenido</h2>
                <p className="text-muted-foreground">
                  Conecta con makers profesionales o comparte tus servicios
                </p>
              </div>

              {mode === "login" ? (
                <>
                  <h3 className="text-xl font-semibold text-center mb-4">Iniciar Sesión</h3>
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
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-center mb-6">Crear Cuenta</h3>
                  
                  {!userType ? (
                    <div className="space-y-4">
                      <div className="text-sm text-center text-muted-foreground mb-4">
                        ¿Qué eres?
                      </div>
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
                  ) : (
                    <>
                      {userType === "client" && (
                        <ClientRegisterForm 
                          onSuccess={() => setLocation("/")}
                          onBack={() => setUserType(null)}
                        />
                      )}
                      {userType === "maker" && (
                        <MakerRegisterForm 
                          onSuccess={() => setLocation("/")}
                          onBack={() => setUserType(null)}
                        />
                      )}
                    </>
                  )}

                  {!userType && (
                    <div className="text-center text-sm mt-6 border-t pt-4">
                      ¿Ya tienes cuenta?{" "}
                      <button
                        onClick={() => {
                          setMode("login");
                          setUserType(null);
                        }}
                        className="text-primary font-semibold hover:underline"
                        data-testid="button-switch-login"
                      >
                        Inicia Sesión
                      </button>
                    </div>
                  )}
                </>
              )}

              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                data-testid="button-back-to-landing"
              >
                Volver a inicio
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
