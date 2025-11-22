import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, User, MapPin, Printer } from "lucide-react";

interface MakerRegisterFormProps {
  onSuccess?: () => void;
}

export default function MakerRegisterForm({ onSuccess }: MakerRegisterFormProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
    printerType: "FDM",
    hasMulticolor: false,
    maxColors: "1",
    maxDimensionX: "",
    maxDimensionY: "",
    maxDimensionZ: "",
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
        userType: "maker",
        makerProfile: {
          printerType: form.printerType,
          hasMulticolor: form.hasMulticolor,
          maxColors: form.hasMulticolor ? parseInt(form.maxColors) : 1,
          maxPrintDimensionX: parseInt(form.maxDimensionX),
          maxPrintDimensionY: parseInt(form.maxDimensionY),
          maxPrintDimensionZ: parseInt(form.maxDimensionZ),
          materials: [],
        },
      });
      return res;
    },
    onSuccess: () => {
      toast({
        title: "¡Bienvenido Maker!",
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
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSelectChange = (value: string) => {
    setForm({ ...form, printerType: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.username) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.maxDimensionX || !form.maxDimensionY || !form.maxDimensionZ) {
        toast({
          title: "Error",
          description: "Por favor completa las dimensiones de tu impresora",
          variant: "destructive",
        });
        return;
      }
      setStep(3);
    } else {
      mutation.mutate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === 1 ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="firstName"
              placeholder="Nombre"
              value={form.firstName}
              onChange={handleChange}
              disabled={mutation.isPending}
              required
              data-testid="input-maker-firstname"
            />
            <Input
              name="lastName"
              placeholder="Apellido"
              value={form.lastName}
              onChange={handleChange}
              disabled={mutation.isPending}
              required
              data-testid="input-maker-lastname"
            />
          </div>

          <Input
            name="username"
            placeholder="Usuario"
            value={form.username}
            onChange={handleChange}
            disabled={mutation.isPending}
            required
            data-testid="input-maker-username"
          />

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            Continuar
          </Button>
        </>
      ) : step === 2 ? (
        <>
          <div>
            <Label htmlFor="printerType" className="text-sm">
              Tipo de Impresora
            </Label>
            <Select value={form.printerType} onValueChange={handleSelectChange}>
              <SelectTrigger data-testid="select-printer-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FDM">FDM (Filamento)</SelectItem>
                <SelectItem value="SLA">SLA (Resina)</SelectItem>
                <SelectItem value="SLS">SLS (Polvos)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Dimensión Máxima de Impresión (mm)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                name="maxDimensionX"
                placeholder="X"
                type="number"
                value={form.maxDimensionX}
                onChange={handleChange}
                disabled={mutation.isPending}
                required
                data-testid="input-dimension-x"
              />
              <Input
                name="maxDimensionY"
                placeholder="Y"
                type="number"
                value={form.maxDimensionY}
                onChange={handleChange}
                disabled={mutation.isPending}
                required
                data-testid="input-dimension-y"
              />
              <Input
                name="maxDimensionZ"
                placeholder="Z"
                type="number"
                value={form.maxDimensionZ}
                onChange={handleChange}
                disabled={mutation.isPending}
                required
                data-testid="input-dimension-z"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="multicolor"
              name="hasMulticolor"
              checked={form.hasMulticolor}
              onCheckedChange={(checked) =>
                setForm({ ...form, hasMulticolor: checked as boolean })
              }
              data-testid="checkbox-multicolor"
            />
            <Label htmlFor="multicolor" className="text-sm cursor-pointer">
              Impresión Multicolor
            </Label>
          </div>

          {form.hasMulticolor && (
            <Input
              name="maxColors"
              placeholder="Máximo de colores"
              type="number"
              min="2"
              value={form.maxColors}
              onChange={handleChange}
              disabled={mutation.isPending}
              data-testid="input-max-colors"
            />
          )}

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
            >
              Continuar
            </Button>
          </div>
        </>
      ) : (
        <>
          <div>
            <Label htmlFor="email" className="text-sm">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              disabled={mutation.isPending}
              required
              data-testid="input-maker-email"
            />
          </div>

          <div>
            <Label htmlFor="location" className="text-sm">
              Ubicación (Opcional)
            </Label>
            <Input
              id="location"
              name="location"
              placeholder="Ciudad, País"
              value={form.location}
              onChange={handleChange}
              disabled={mutation.isPending}
              data-testid="input-maker-location"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm">
              Contraseña
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              disabled={mutation.isPending}
              required
              data-testid="input-maker-password"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-sm">
              Confirmar Contraseña
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={mutation.isPending}
              required
              data-testid="input-maker-confirm-password"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep(2)}
              disabled={mutation.isPending}
            >
              Atrás
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={mutation.isPending}
              data-testid="button-maker-register-submit"
            >
              {mutation.isPending ? "Registrando..." : "Registrarse"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
