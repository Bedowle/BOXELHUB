import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

export default function VerifyEmailPage() {
  const [location, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setStatus("error");
          setMessage("Token de verificación no encontrado");
          return;
        }

        // Call verification endpoint
        const response = await apiRequest("POST", "/api/auth/verify-email", { token });
        
        setStatus("success");
        setMessage("¡Email verificado correctamente!");
        toast({
          title: "Éxito",
          description: "Tu cuenta ha sido verificada. Redirigiendo...",
        });

        // Redirect to home after 2 seconds
        setTimeout(() => setLocation("/"), 2000);
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Error al verificar el email");
        toast({
          title: "Error",
          description: error.message || "No se pudo verificar el email",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-primary/50 backdrop-blur-md border-b border-primary/20 p-4">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
            data-testid="button-back-verify-email"
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </Button>
        </div>
      </header>

      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-lg font-semibold">Verificando tu email...</p>
            <p className="text-muted-foreground text-sm">Por favor espera un momento</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <p className="text-lg font-semibold">{message}</p>
            <p className="text-muted-foreground text-sm">Redirigiendo al dashboard...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <p className="text-lg font-semibold">{message}</p>
            <Button onClick={() => window.history.back()} className="w-full">
              Volver al login
            </Button>
          </div>
        )}
        </Card>
      </div>
    </div>
  );
}
