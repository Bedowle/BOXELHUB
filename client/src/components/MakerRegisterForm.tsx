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
import LocationMapPicker from "@/components/LocationMapPicker";
import { Mail, Lock, User, MapPin, Printer } from "lucide-react";

interface MakerRegisterFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function MakerRegisterForm({ onSuccess, onBack }: MakerRegisterFormProps) {
  const [form, setForm] = useState({
    // Step 1: Basic info + Address
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Address fields
    addressSimplifiedMode: false,
    addressPostalCode: "",
    addressStreetType: "",
    addressStreetName: "",
    addressNumber: "",
    addressFloor: "",
    addressDoor: "",
    addressLatitude: "40.4168",
    addressLongitude: "-3.7038",
    addressRadius: 0,
    // Step 2: Printer info
    printerType: "AnycubicKobra2Max",
    customPrinterType: "",
    hasMulticolor: false,
    maxColors: "1",
    maxDimensionX: "",
    maxDimensionY: "",
    maxDimensionZ: "",
  });

  const [step, setStep] = useState(1);
  const [printerSearch, setPrinterSearch] = useState("");
  const [showCustomPrinter, setShowCustomPrinter] = useState(false);
  const { toast } = useToast();

  const printerOptions = [
    "Anycubic Kobra 2 Max",
    "Anycubic Kobra 2 Pro",
    "Anycubic Kobra 3",
    "Bambu Lab A1 Mini",
    "Bambu Lab P1S",
    "Bambu Lab X1 Carbon",
    "Creality Ender 3 S1",
    "Creality Ender 3 V3",
    "Creality K1",
    "Elegoo Neptune 3",
    "Flashforge Adventurer 5",
    "FLSUN S1",
    "FLSUN T1 Pro",
    "Formlabs Form 3",
    "Kingroon KP3S",
    "Prusa MK4",
    "Prusa MINI+",
    "Prusa XL",
    "Ultimaker S5",
    "Voxelab Aquila",
  ];

  const printerEnumMap: { [key: string]: string } = {
    "Anycubic Kobra 2 Max": "AnycubicKobra2Max",
    "Anycubic Kobra 2 Pro": "AnycubicKobra2Pro",
    "Anycubic Kobra 3": "AnycubicKobra3",
    "Bambu Lab A1 Mini": "BambuLabA1Mini",
    "Bambu Lab P1S": "BambuLabP1S",
    "Bambu Lab X1 Carbon": "BambuLabX1Carbon",
    "Creality Ender 3 S1": "CrealityEnder3S1",
    "Creality Ender 3 V3": "CrealityEnder3V3",
    "Creality K1": "CrealityK1",
    "Elegoo Neptune 3": "ElegooNeptune3",
    "Flashforge Adventurer 5": "FlashforgeAdventurer5",
    "FLSUN S1": "FLsunS1",
    "FLSUN T1 Pro": "FLsunT1Pro",
    "Formlabs Form 3": "FormlabsForm3",
    "Kingroon KP3S": "KingroonKP3S",
    "Prusa MK4": "PrusaMK4",
    "Prusa MINI+": "PrusaMINI",
    "Prusa XL": "PrusaXL",
    "Ultimaker S5": "UltimakerS5",
    "Voxelab Aquila": "VoxelabAquila",
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (form.password !== form.confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }
      if (!form.email) {
        throw new Error("El email es requerido");
      }
      if (!form.password || form.password.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres");
      }

      // Validate address
      if (!form.addressSimplifiedMode) {
        if (!form.addressPostalCode || !form.addressStreetName || !form.addressNumber) {
          throw new Error("Por favor completa los datos de dirección");
        }
      } else {
        if (!form.addressPostalCode) {
          throw new Error("Por favor ingresa el código postal");
        }
      }

      const res = await apiRequest("POST", "/api/auth/register", {
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        email: form.email,
        password: form.password,
        userType: "maker",
        makerProfile: {
          printerType: showCustomPrinter ? form.customPrinterType : form.printerType,
          hasMulticolor: form.hasMulticolor,
          maxColors: form.hasMulticolor ? parseInt(form.maxColors) : 1,
          maxPrintDimensionX: parseInt(form.maxDimensionX),
          maxPrintDimensionY: parseInt(form.maxDimensionY),
          maxPrintDimensionZ: parseInt(form.maxDimensionZ),
          materials: [],
          // Address info
          addressSimplifiedMode: form.addressSimplifiedMode,
          addressPostalCode: form.addressPostalCode,
          addressStreetType: form.addressStreetType,
          addressStreetName: form.addressStreetName,
          addressNumber: form.addressNumber,
          addressFloor: form.addressFloor,
          addressDoor: form.addressDoor,
          addressLatitude: form.addressLatitude,
          addressLongitude: form.addressLongitude,
          addressRadius: form.addressRadius,
        },
      });
      return res;
    },
    onSuccess: (response: any) => {
      toast({
        title: "¡Bienvenido Maker!",
        description: "Tu cuenta ha sido creada. Revisa los logs del servidor para el link de verificación.",
      });
      if (response.verificationToken) {
        console.log("=== VERIFICATION TOKEN ===");
        console.log("Token:", response.verificationToken);
        console.log("Link: /verify?token=" + response.verificationToken);
        console.log("==========================");
      }
      
      // Save registration data to sessionStorage for MakerProfileDialog to use
      sessionStorage.setItem("makerRegistrationData", JSON.stringify({
        printerType: form.printerType,
        hasMulticolor: form.hasMulticolor,
        maxColors: form.hasMulticolor ? parseInt(form.maxColors) : 1,
        maxPrintDimensionX: form.maxDimensionX ? parseInt(form.maxDimensionX) : undefined,
        maxPrintDimensionY: form.maxDimensionY ? parseInt(form.maxDimensionY) : undefined,
        maxPrintDimensionZ: form.maxDimensionZ ? parseInt(form.maxDimensionZ) : undefined,
        addressPostalCode: form.addressPostalCode,
        addressStreetType: form.addressStreetType,
        addressStreetName: form.addressStreetName,
        addressNumber: form.addressNumber,
        addressFloor: form.addressFloor,
        addressDoor: form.addressDoor,
        addressLatitude: form.addressLatitude,
        addressLongitude: form.addressLongitude,
        addressRadius: form.addressRadius,
      }));
      
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
      if (!form.firstName || !form.lastName || !form.username || !form.email || !form.password || !form.confirmPassword) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos",
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

      // Validate address
      if (!form.addressSimplifiedMode) {
        if (!form.addressStreetName || !form.addressNumber || !form.addressPostalCode) {
          toast({
            title: "Error",
            description: "Por favor completa los datos de dirección",
            variant: "destructive",
          });
          return;
        }
      } else {
        if (!form.addressPostalCode) {
          toast({
            title: "Error",
            description: "Por favor ingresa el código postal",
            variant: "destructive",
          });
          return;
        }
      }

      setStep(2);
    } else if (step === 2) {
      // Validate step 2
      if (!form.maxDimensionX || !form.maxDimensionY || !form.maxDimensionZ) {
        toast({
          title: "Error",
          description: "Por favor completa las dimensiones de tu impresora",
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
          {/* STEP 1: BASIC INFO + ADDRESS */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary">Información Personal</h3>

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
                  placeholder="Contraseña (mín. 8 caracteres)"
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
          </div>

          {/* ADDRESS SECTION */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-semibold text-primary">Tu Dirección</h3>

            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
              <Checkbox
                id="simplified-mode"
                name="addressSimplifiedMode"
                checked={form.addressSimplifiedMode}
                onCheckedChange={(checked) =>
                  setForm({ ...form, addressSimplifiedMode: checked as boolean })
                }
                data-testid="checkbox-simplified-address"
              />
              <Label htmlFor="simplified-mode" className="text-sm cursor-pointer font-medium">
                Solo código postal
              </Label>
            </div>

            {form.addressSimplifiedMode ? (
              <Input
                name="addressPostalCode"
                placeholder="Código postal"
                value={form.addressPostalCode}
                onChange={handleChange}
                disabled={mutation.isPending}
                required
                data-testid="input-postal-code-simple"
              />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={form.addressStreetType} onValueChange={(value) => setForm({ ...form, addressStreetType: value })}>
                    <SelectTrigger data-testid="select-street-type">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Calle">Calle</SelectItem>
                      <SelectItem value="Avenida">Avenida</SelectItem>
                      <SelectItem value="Vía">Vía</SelectItem>
                      <SelectItem value="Plaza">Plaza</SelectItem>
                      <SelectItem value="Pasaje">Pasaje</SelectItem>
                      <SelectItem value="Camino">Camino</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    name="addressStreetName"
                    placeholder="Nombre"
                    value={form.addressStreetName}
                    onChange={handleChange}
                    disabled={mutation.isPending}
                    required
                    data-testid="input-street-name"
                  />

                  <Input
                    name="addressNumber"
                    placeholder="Número"
                    value={form.addressNumber}
                    onChange={handleChange}
                    disabled={mutation.isPending}
                    required
                    data-testid="input-address-number"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    name="addressFloor"
                    placeholder="Piso (opt.)"
                    value={form.addressFloor}
                    onChange={handleChange}
                    disabled={mutation.isPending}
                    data-testid="input-floor"
                  />

                  <Input
                    name="addressDoor"
                    placeholder="Puerta (opt.)"
                    value={form.addressDoor}
                    onChange={handleChange}
                    disabled={mutation.isPending}
                    data-testid="input-door"
                  />

                  <Input
                    name="addressPostalCode"
                    placeholder="Código postal"
                    value={form.addressPostalCode}
                    onChange={handleChange}
                    disabled={mutation.isPending}
                    required
                    data-testid="input-postal-code-full"
                  />
                </div>
              </>
            )}

            {/* MAP PICKER */}
            <LocationMapPicker
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
              isApproximate={form.addressSimplifiedMode}
            />
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending || passwordError}>
            Continuar a Impresora
          </Button>
        </>
      ) : (
        <>
          {/* STEP 2: PRINTER INFO */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary">Especificaciones de tu Impresora</h3>

            <div className="space-y-2">
              <Label htmlFor="printerType" className="text-sm font-semibold block">
                Tipo de Impresora
              </Label>
              <Input
                placeholder="Busca tu impresora..."
                value={printerSearch}
                onChange={(e) => setPrinterSearch(e.target.value)}
                className="w-full mb-2"
                data-testid="input-printer-search"
              />
              {!showCustomPrinter ? (
                <Select
                  value={form.printerType}
                  onValueChange={(value) => {
                    if (value === "Other") {
                      setShowCustomPrinter(true);
                      setForm({ ...form, customPrinterType: "" });
                    } else {
                      setForm({ ...form, printerType: value, customPrinterType: "" });
                    }
                    setPrinterSearch("");
                  }}
                >
                  <SelectTrigger id="printerType" data-testid="select-printer-type">
                    <SelectValue placeholder="Selecciona una impresora..." />
                  </SelectTrigger>
                  <SelectContent>
                    {printerOptions
                      .filter((p) => p.toLowerCase().includes(printerSearch.toLowerCase()))
                      .map((printer) => (
                        <SelectItem key={printer} value={printerEnumMap[printer]} data-testid={`printer-option-${printer}`}>
                          {printer}
                        </SelectItem>
                      ))}
                    <SelectItem value="Other" data-testid="printer-option-other">
                      Otra impresora
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <>
                  <Input
                    placeholder="Nombre de tu impresora (ej: Creality Ender 3)"
                    value={form.customPrinterType}
                    onChange={(e) => setForm({ ...form, customPrinterType: e.target.value })}
                    className="w-full mb-2"
                    data-testid="input-custom-printer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomPrinter(false);
                      setForm({ ...form, customPrinterType: "", printerType: "AnycubicKobra2Max" });
                      setPrinterSearch("");
                    }}
                  >
                    Usar lista
                  </Button>
                </>
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
