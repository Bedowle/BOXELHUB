import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff } from "lucide-react";

interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
}

export default function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }
      if (newPassword.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres");
      }
      const res = await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword,
      });
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión.",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No pudimos cambiar tu contraseña",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="new-password" className="text-sm">
          Nueva Contraseña
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={mutation.isPending}
            className="pl-10 pr-10"
            data-testid="input-new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            data-testid="button-toggle-password"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Mínimo 8 caracteres</p>
      </div>

      <div>
        <Label htmlFor="confirm-password" className="text-sm">
          Confirmar Contraseña
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={mutation.isPending}
            className="pl-10 pr-10"
            data-testid="input-confirm-password"
            required
          />
        </div>
      </div>

      {newPassword && confirmPassword && newPassword !== confirmPassword && (
        <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={
          mutation.isPending ||
          !newPassword ||
          !confirmPassword ||
          newPassword !== confirmPassword ||
          newPassword.length < 8
        }
        size="lg"
        data-testid="button-reset-submit"
      >
        {mutation.isPending ? "Actualizando..." : "Actualizar Contraseña"}
      </Button>
    </form>
  );
}
