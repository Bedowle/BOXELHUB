import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMakerProfileSchema, type InsertMakerProfile, type MakerProfile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { PrinterCombobox } from "@/components/PrinterCombobox";

interface MakerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: MakerProfile | null;
}

export function MakerProfileDialog({ open, onOpenChange, profile }: MakerProfileDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get registration data from sessionStorage if available
  const getRegistrationData = () => {
    try {
      const data = sessionStorage.getItem("makerRegistrationData");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  const registrationData = getRegistrationData();

  const form = useForm<InsertMakerProfile>({
    resolver: zodResolver(insertMakerProfileSchema),
    defaultValues: profile ? {
      userId: profile.userId,
      printerType: profile.printerType,
      materials: profile.materials || [],
      maxPrintDimensionX: profile.maxPrintDimensionX || undefined,
      maxPrintDimensionY: profile.maxPrintDimensionY || undefined,
      maxPrintDimensionZ: profile.maxPrintDimensionZ || undefined,
      hasMulticolor: profile.hasMulticolor || false,
      maxColors: profile.maxColors || 1,
      location: profile.location || "",
      capabilities: profile.capabilities || "",
    } : registrationData ? {
      userId: user?.id || "",
      printerType: registrationData.printerType || "Ender3",
      materials: [],
      maxPrintDimensionX: registrationData.maxPrintDimensionX,
      maxPrintDimensionY: registrationData.maxPrintDimensionY,
      maxPrintDimensionZ: registrationData.maxPrintDimensionZ,
      hasMulticolor: registrationData.hasMulticolor || false,
      maxColors: registrationData.maxColors || 1,
      location: registrationData.addressPostalCode ? `${registrationData.addressPostalCode}` : "",
      capabilities: "",
    } : {
      userId: user?.id || "",
      printerType: "Ender3",
      materials: [],
      hasMulticolor: false,
      maxColors: 1,
      location: "",
      capabilities: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertMakerProfile) => {
      if (profile) {
        await apiRequest("PUT", "/api/maker-profile", data);
      } else {
        await apiRequest("POST", "/api/maker-profile", data);
      }
    },
    onSuccess: () => {
      toast({
        title: profile ? "Perfil actualizado" : "Perfil creado",
        description: "Tu perfil de maker ha sido guardado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/maker-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Iniciando sesión...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el perfil",
        variant: "destructive",
      });
    },
  });

  // Reset form when profile changes (for existing profiles)
  useEffect(() => {
    if (profile) {
      form.reset({
        userId: profile.userId,
        printerType: profile.printerType,
        materials: profile.materials || [],
        maxPrintDimensionX: profile.maxPrintDimensionX || undefined,
        maxPrintDimensionY: profile.maxPrintDimensionY || undefined,
        maxPrintDimensionZ: profile.maxPrintDimensionZ || undefined,
        hasMulticolor: profile.hasMulticolor || false,
        maxColors: profile.maxColors || 1,
        location: profile.location || "",
        capabilities: profile.capabilities || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (data: InsertMakerProfile) => {
    mutation.mutate({ ...data, userId: user?.id || "" });
  };

  const availableMaterials = ["PLA", "ABS", "PETG", "TPU", "Nylon", "Resina", "PC", "ASA"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{profile ? "Editar" : "Configurar"} Perfil de Maker</DialogTitle>
          <DialogDescription>
            Completa la información de tu perfil para que los clientes conozcan tus capacidades
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Printer Type */}
            <FormField
              control={form.control}
              name="printerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Impresora</FormLabel>
                  <FormControl>
                    <PrinterCombobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Busca o escribe tu impresora..."
                      testId="select-printer-type"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Materials */}
            <FormField
              control={form.control}
              name="materials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Materiales Disponibles</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {availableMaterials.map((material) => (
                      <div key={material} className="flex items-center space-x-2">
                        <Checkbox
                          id={`material-${material}`}
                          checked={field.value?.includes(material)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, material]);
                            } else {
                              field.onChange(current.filter((m) => m !== material));
                            }
                          }}
                          data-testid={`checkbox-material-${material}`}
                        />
                        <label
                          htmlFor={`material-${material}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {material}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Print Dimensions */}
            <div className="space-y-4">
              <FormLabel>Dimensiones Máximas de Impresión (mm)</FormLabel>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="maxPrintDimensionX"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>X (ancho)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="200"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-dimension-x"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxPrintDimensionY"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Y (profundidad)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="200"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-dimension-y"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxPrintDimensionZ"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Z (altura)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="200"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-dimension-z"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Multicolor */}
            <FormField
              control={form.control}
              name="hasMulticolor"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-multicolor"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Impresión Multicolor</FormLabel>
                    <FormDescription>
                      ¿Tu impresora puede imprimir en múltiples colores?
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Max Colors - Only show if multicolor is enabled */}
            {form.watch("hasMulticolor") && (
              <FormField
                control={form.control}
                name="maxColors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número Máximo de Colores</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="2"
                        placeholder="Ej: 4" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        data-testid="input-max-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Madrid, España" 
                      {...field} 
                      value={field.value || ""}
                      data-testid="input-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capabilities */}
            <FormField
              control={form.control}
              name="capabilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe tu experiencia, tipos de proyectos en los que te especializas, acabados que ofreces, etc."
                      className="min-h-24"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-capabilities"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={!profile}
                data-testid="button-back-profile"
              >
                ← Atrás
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1"
                data-testid="button-save-profile"
              >
                {mutation.isPending ? "Guardando..." : (profile ? "Actualizar Perfil" : "Crear Perfil")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
