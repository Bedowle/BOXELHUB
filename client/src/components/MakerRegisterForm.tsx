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
  onBack?: () => void;
}

export default function MakerRegisterForm({ onSuccess, onBack }: MakerRegisterFormProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
    printerType: "Ender3",
    hasMulticolor: false,
    maxColors: "1",
    maxDimensionX: "",
    maxDimensionY: "",
    maxDimensionZ: "",
  });
  const [step, setStep] = useState(1);
  const [printerSearch, setPrinterSearch] = useState("");
  const [printerDropdownOpen, setPrinterDropdownOpen] = useState(false);
  const { toast } = useToast();

  const printerOptions = ["Ender3", "BambooLab"];

  const mutation = useMutation({
    mutationFn: async () => {
      if (form.password !== form.confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }
      if (!form.email) {
        throw new Error("El email es requerido");
      }
      if (!form.password) {
        throw new Error("La contraseña es requerida");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.username || !form.email || !form.password || !form.confirmPassword) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos",
          variant: "destructive",
        });
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast({
          title: "Error",
          description: "Las contraseñas no coinciden",
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

  const passwordsMatch = form.password === form.confirmPassword;
  const passwordError = form.password && form.confirmPassword && !passwordsMatch;

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

          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={handleChange}
                disabled={mutation.isPending}
                required
                className="pl-10"
                data-testid="input-maker-email"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="password"
                type="password"
                placeholder="Contraseña"
                value={form.password}
                onChange={handleChange}
                disabled={mutation.isPending}
                required
                className="pl-10"
                data-testid="input-maker-password"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirmar contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={mutation.isPending}
                required
                className={`pl-10 ${passwordError ? 'border-red-500' : ''}`}
                data-testid="input-maker-confirm-password"
              />
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm mt-1" data-testid="error-password-mismatch">
                Las contraseñas no coinciden
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending || passwordError}>
            Continuar
          </Button>
        </>
      ) : step === 2 ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="printerType" className="text-sm">
              Tipo de Impresora
            </Label>
            
            <div className="space-y-2">
              <Input
                placeholder="Buscar: Ender3 o BambooLab..."
                value={printerSearch}
                onChange={(e) => setPrinterSearch(e.target.value)}
                className="w-full"
                data-testid="input-printer-search"
              />
              
              <div className="border rounded-md p-2 bg-background space-y-1" data-testid="printer-options">
                {printerOptions.length > 0 ? (
                  printerOptions
                    .filter(p => !printerSearch || p.toLowerCase().includes(printerSearch.toLowerCase()))
                    .map(printer => (
                      <button
                        key={printer}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, printerType: printer });
                          setPrinterSearch("");
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          form.printerType === printer
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "hover:bg-muted"
                        }`}
                        data-testid={`printer-option-${printer}`}
                      >
                        {printer}
                        {form.printerType === printer && " ✓"}
                      </button>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground px-3 py-2">
                    No hay opciones disponibles
                  </p>
                )}
              </div>
            </div>
            
            {form.printerType && (
              <p className="text-xs text-muted-foreground">
                ✓ Seleccionado: <span className="font-semibold text-foreground">{form.printerType}</span>
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm">Dimensión Máxima de Impresión (mm)</Label>
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
              ← Atrás
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
                data-testid="input-maker-location"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep(2)}
              disabled={mutation.isPending}
            >
              ← Atrás
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
