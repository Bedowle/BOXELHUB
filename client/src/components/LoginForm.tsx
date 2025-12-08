import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export default function LoginForm({ onSuccess, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
      });
      return res;
    },
    onSuccess: () => {
      toast({
        title: "¡Bienvenido!",
        description: "Iniciando sesión...",
      });
      // Invalidate auth query and wait for it to refresh with the new session
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setTimeout(() => {
          onSuccess?.();
        }, 500);
      }, 300);
    },
    onError: (error: any) => {
      toast({
        title: "Error de login",
        description: error.message || "Credenciales inválidas",
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="login-email" className="text-sm">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={mutation.isPending}
            className="pl-10"
            data-testid="input-login-email"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="login-password" className="text-sm">
          Contraseña
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={mutation.isPending}
            className="pl-10"
            data-testid="input-login-password"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={mutation.isPending || !email || !password}
        size="lg"
        data-testid="button-login-submit"
      >
        {mutation.isPending ? "Iniciando..." : "Iniciar Sesión"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-primary text-sm hover:underline"
          data-testid="button-forgot-password"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
    </form>
  );
}
