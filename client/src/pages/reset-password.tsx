import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [location, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      setIsExpired(true);
    } else {
      setToken(tokenParam);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Recuperar Contraseña</h2>
            <p className="text-muted-foreground text-sm">
              Ingresa tu nueva contraseña
            </p>
          </div>

          {isExpired ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Link expirado o inválido</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  El link de recuperación ha expirado. Por favor, solicita uno nuevo.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => setLocation("/auth")}
                data-testid="button-back-to-auth"
              >
                Volver a Login
              </Button>
            </div>
          ) : token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
