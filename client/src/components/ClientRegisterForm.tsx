import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, MapPin } from "lucide-react";

interface ClientRegisterFormProps {
  onSuccess?: () => void;
}

export default function ClientRegisterForm({ onSuccess }: ClientRegisterFormProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
  });
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      if (form.password !== form.confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }

      const res = await apiRequest("POST", "/api/auth/register", {
        ...form,
        userType: "client",
      });
      return res;
    },
    onSuccess: () => {
      toast({
        title: "¡Registro exitoso!",
        description: "Revisa tu email para verificar tu cuenta",
      });
      setTimeout(() => onSuccess?.(), 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error en registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.firstName || !form.lastName) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else {
      mutation.mutate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === 1 ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName" className="text-sm">
                Nombre
              </Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Juan"
                value={form.firstName}
                onChange={handleChange}
                disabled={mutation.isPending}
                required
                data-testid="input-client-firstname"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm">
                Apellido
              </Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Pérez"
                value={form.lastName}
                onChange={handleChange}
                disabled={mutation.isPending}
                required
                data-testid="input-client-lastname"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="username" className="text-sm">
              Usuario
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                name="username"
                placeholder="juanperez123"
                value={form.username}
                onChange={handleChange}
                disabled={mutation.isPending}
                className="pl-10"
                required
                data-testid="input-client-username"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location" className="text-sm">
              Ubicación (Opcional)
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                name="location"
                placeholder="Ciudad, País"
                value={form.location}
                onChange={handleChange}
                disabled={mutation.isPending}
                className="pl-10"
                data-testid="input-client-location"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            Continuar
          </Button>
        </>
      ) : (
        <>
          <div>
            <Label htmlFor="email" className="text-sm">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={handleChange}
                disabled={mutation.isPending}
                className="pl-10"
                required
                data-testid="input-client-email"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-sm">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                disabled={mutation.isPending}
                className="pl-10"
                required
                data-testid="input-client-password"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-sm">
              Confirmar Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={mutation.isPending}
                className="pl-10"
                required
                data-testid="input-client-confirm-password"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep(1)}
              disabled={mutation.isPending}
            >
              Atrás
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={mutation.isPending}
              data-testid="button-client-register-submit"
            >
              {mutation.isPending ? "Registrando..." : "Registrarse"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
