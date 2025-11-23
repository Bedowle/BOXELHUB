import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Mail } from "lucide-react";

interface ClientLoginPageProps {
  onSuccess?: () => void;
}

export default function ClientLoginPage({ onSuccess }: ClientLoginPageProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (emailAddr: string) => {
      await apiRequest("POST", "/api/auth/client-login", { email: emailAddr });
    },
    onSuccess: () => {
      toast({
        title: "¡Verifica tu email!",
        description: "Enviamos un link de acceso a tu email. Haz clic para continuar.",
      });
      setSubmitted(true);
      setTimeout(() => onSuccess?.(), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el login",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      mutation.mutate(email);
    } else {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-4 text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl">Cliente</CardTitle>
              <CardDescription className="text-base">
                Ingresa tu email para acceder
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-8">
                <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">¡Link enviado!</h3>
                <p className="text-sm text-muted-foreground">
                  Revisa tu email para confirmar tu acceso
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Dirección de Email
                  </label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={mutation.isPending}
                    data-testid="input-client-email"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending || !email}
                  size="lg"
                  data-testid="button-client-login"
                >
                  {mutation.isPending ? "Enviando..." : "Continuar"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Recibirás un link seguro en tu email para acceder
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
