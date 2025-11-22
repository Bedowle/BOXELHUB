import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ClientLocationMapPicker from "@/components/ClientLocationMapPicker";
import { Mail, Lock, User, MapPin } from "lucide-react";

interface ClientRegisterFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function ClientRegisterForm({ onSuccess, onBack }: ClientRegisterFormProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Location (optional)
    hasLocation: false,
    addressPostalCode: "",
    addressLatitude: "40.4168",
    addressLongitude: "-3.7038",
    addressRadius: 0,
    // Policies
    acceptedTerms: false,
    acceptedPrivacy: false,
  });
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      if (form.password !== form.confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }
      if (form.password.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres");
      }
      if (!form.acceptedTerms || !form.acceptedPrivacy) {
        throw new Error("Debes aceptar las políticas y privacidad");
      }

      const res = await apiRequest("POST", "/api/auth/register", {
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        email: form.email,
        password: form.password,
        userType: "client",
        hasLocation: form.hasLocation,
        addressPostalCode: form.hasLocation ? form.addressPostalCode : null,
        addressLatitude: form.hasLocation ? form.addressLatitude : null,
        addressLongitude: form.hasLocation ? form.addressLongitude : null,
        addressRadius: form.hasLocation ? form.addressRadius : null,
        acceptedTermsAt: new Date().toISOString(),
        acceptedPrivacyAt: new Date().toISOString(),
      });
      return res;
    },
    onSuccess: (response: any) => {
      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada. Revisa los logs del servidor para el link de verificación.",
      });
      if (response.verificationToken) {
        console.log("=== VERIFICATION TOKEN ===");
        console.log("Token:", response.verificationToken);
        console.log("Link: /verify?token=" + response.verificationToken);
        console.log("==========================");
      }
      setTimeout(() => onSuccess?.(), 3000);
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
      // Validate step 1
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
      // Validate step 2
      if (!form.email || !form.password || !form.confirmPassword) {
        toast({
          title: "Error",
          description: "Por favor completa email y contraseña",
          variant: "destructive",
        });
        return;
      }
      if (form.password.length < 8) {
        toast({
          title: "Error",
          description: "La contraseña debe tener al menos 8 caracteres",
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
      setStep(3);
    } else {
      // Validate step 3
      if (form.hasLocation && !form.addressPostalCode) {
        toast({
          title: "Error",
          description: "Por favor ingresa el código postal",
          variant: "destructive",
        });
        return;
      }
      if (!form.acceptedTerms || !form.acceptedPrivacy) {
        toast({
          title: "Error",
          description: "Debes aceptar las políticas y privacidad",
          variant: "destructive",
        });
        return;
      }
      mutation.mutate();
    }
  };

  const passwordsMatch = form.password === form.confirmPassword;
  const passwordError = form.password && form.confirmPassword && !passwordsMatch;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === 1 ? (
        <>
          <h3 className="text-sm font-semibold text-primary mb-3">Información Básica</h3>

          <div className="grid grid-cols-2 gap-3">
            <Input
              name="firstName"
              placeholder="Nombre"
              value={form.firstName}
              onChange={handleChange}
              disabled={mutation.isPending}
              required
              data-testid="input-client-firstname"
            />
            <Input
              name="lastName"
              placeholder="Apellido"
              value={form.lastName}
              onChange={handleChange}
              disabled={mutation.isPending}
              required
              data-testid="input-client-lastname"
            />
          </div>

          <Input
            name="username"
            placeholder="Usuario"
            value={form.username}
            onChange={handleChange}
            disabled={mutation.isPending}
            required
            data-testid="input-client-username"
          />

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            Continuar
          </Button>
        </>
      ) : step === 2 ? (
        <>
          <h3 className="text-sm font-semibold text-primary mb-3">Credenciales</h3>

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
                data-testid="input-client-email"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="password"
                type="password"
                placeholder="Contraseña (mín. 8 caracteres)"
                value={form.password}
                onChange={handleChange}
                disabled={mutation.isPending}
                required
                className="pl-10"
                data-testid="input-client-password"
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
                data-testid="input-client-confirm-password"
              />
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm mt-1" data-testid="error-password-mismatch">
                Las contraseñas no coinciden
              </p>
            )}
          </div>

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
              disabled={mutation.isPending || passwordError}
            >
              Continuar
            </Button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-sm font-semibold text-primary mb-3">Ubicación y Políticas</h3>

          {/* LOCATION SECTION */}
          <div className="space-y-3 p-3 bg-muted/50 rounded-md border">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-location"
                name="hasLocation"
                checked={form.hasLocation}
                onCheckedChange={(checked) =>
                  setForm({ ...form, hasLocation: checked as boolean })
                }
                data-testid="checkbox-client-has-location"
              />
              <Label htmlFor="has-location" className="text-sm cursor-pointer font-medium">
                Quiero compartir mi ubicación (Opcional)
              </Label>
            </div>

            {form.hasLocation && (
              <div className="space-y-3 pt-3 border-t">
                <Input
                  name="addressPostalCode"
                  placeholder="Código Postal (ej: 28001)"
                  value={form.addressPostalCode}
                  onChange={handleChange}
                  disabled={mutation.isPending}
                  required
                  data-testid="input-client-postal-code"
                />

                <ClientLocationMapPicker
                  value={{
                    latitude: form.addressLatitude,
                    longitude: form.addressLongitude,
                    radius: form.addressRadius,
                  }}
                  onChange={(data) =>
                    setForm({
                      ...form,
                      addressLatitude: data.latitude,
                      addressLongitude: data.longitude,
                      addressRadius: data.radius,
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* POLICIES SECTION */}
          <div className="space-y-3 p-3 bg-muted/30 rounded-md border">
            <Label className="text-sm font-semibold block">Aceptar Políticas</Label>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="accept-terms"
                name="acceptedTerms"
                checked={form.acceptedTerms}
                onCheckedChange={(checked) =>
                  setForm({ ...form, acceptedTerms: checked as boolean })
                }
                data-testid="checkbox-accept-terms"
                className="mt-1"
              />
              <Label htmlFor="accept-terms" className="text-sm cursor-pointer leading-relaxed">
                Acepto los{" "}
                <a href="/terms" className="text-primary hover:underline">
                  Términos de Servicio
                </a>
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="accept-privacy"
                name="acceptedPrivacy"
                checked={form.acceptedPrivacy}
                onCheckedChange={(checked) =>
                  setForm({ ...form, acceptedPrivacy: checked as boolean })
                }
                data-testid="checkbox-accept-privacy"
                className="mt-1"
              />
              <Label htmlFor="accept-privacy" className="text-sm cursor-pointer leading-relaxed">
                Acepto la{" "}
                <a href="/privacy" className="text-primary hover:underline">
                  Política de Privacidad
                </a>
              </Label>
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
              disabled={
                mutation.isPending ||
                !form.acceptedTerms ||
                !form.acceptedPrivacy ||
                (form.hasLocation && !form.addressPostalCode)
              }
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
