import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function ForgotPasswordForm({ onSuccess, onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
      return res;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Email enviado",
        description: "Revisa tu email para el link de recuperación",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No pudimos procesar tu solicitud",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: "Email inválido",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate();
  };

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <div>
          <h3 className="text-lg font-semibold mb-2">Email enviado</h3>
          <p className="text-muted-foreground text-sm">
            Hemos enviado un link de recuperación a {email}
          </p>
          <p className="text-muted-foreground text-xs mt-4">
            Revisa tu email (incluyendo spam) dentro de 24 horas
          </p>
        </div>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onBack}
          data-testid="button-back-to-login"
        >
          Volver a Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="forgot-email" className="text-sm">
          Ingresa tu email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="forgot-email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={mutation.isPending}
            className="pl-10"
            data-testid="input-forgot-email"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={mutation.isPending || !email}
        size="lg"
        data-testid="button-send-reset"
      >
        {mutation.isPending ? "Enviando..." : "Enviar Link de Recuperación"}
      </Button>

      <Button 
        type="button"
        variant="ghost" 
        className="w-full"
        onClick={onBack}
        disabled={mutation.isPending}
        data-testid="button-cancel-forgot"
      >
        Cancelar
      </Button>
    </form>
  );
}
