import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type InsertProject } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UploadProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadProjectDialog({ open, onOpenChange }: UploadProjectDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      stlFileName: "",
      stlFileContent: undefined,
      stlFileNames: [],
      stlFileContents: [],
      description: "",
      material: "",
      specifications: {
        dimensionX: "",
        dimensionY: "",
        dimensionZ: "",
      },
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      console.log("[UploadProjectDialog] Submitting project:", data);
      const response = await apiRequest("POST", "/api/projects", data);
      console.log("[UploadProjectDialog] Server response:", response);
      return response;
    },
    onSuccess: () => {
      console.log("[UploadProjectDialog] Upload successful");
      setIsSuccess(true);
      
      toast({
        title: "¡Proyecto Publicado!",
        description: "Tu proyecto está disponible para que los makers hagan ofertas",
      });
      
      // Reset form and close dialog after 2 seconds
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/projects/my-projects"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects/available"] });
        form.reset();
        setFileNames([]);
        setIsSuccess(false);
        onOpenChange(false);
      }, 2000);
    },
    onError: (error: Error) => {
      console.error("[UploadProjectDialog] Upload error:", error);
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
        title: "Error al publicar",
        description: error.message || "No se pudo crear el proyecto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProject) => {
    console.log("[UploadProjectDialog] Form validation passed, submitting...");
    console.log("[UploadProjectDialog] Form data:", data);
    mutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFileNames: string[] = [];
      const newFileContents: string[] = [];
      const validFiles = Array.from(files).slice(0, 10); // Max 10 files
      let loadedCount = 0;

      validFiles.forEach((file) => {
        newFileNames.push(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const base64Content = content.split(',')[1] || content;
          newFileContents.push(base64Content);
          loadedCount++;

          if (loadedCount === validFiles.length) {
            setFileNames(newFileNames);
            form.setValue("stlFileNames", newFileNames);
            form.setValue("stlFileContents", newFileContents);
            // Keep legacy fields for backwards compatibility
            if (newFileNames.length > 0) {
              form.setValue("stlFileName", newFileNames[0]);
              form.setValue("stlFileContent", newFileContents[0]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const isSubmitDisabled = mutation.isPending || fileNames.length === 0 || !form.formState.isValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" style={{ overflow: "visible" }}>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">¡Publicado!</h3>
            <p className="text-muted-foreground max-w-md">
              Tu proyecto está disponible y los makers pueden empezar a hacer ofertas
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Subir Nuevo Proyecto STL</DialogTitle>
              <DialogDescription>
                Completa los detalles de tu proyecto para que los makers puedan enviar ofertas precisas
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 pr-4" style={{ overflow: "auto" }}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pl-0">
                {/* File Upload */}
                <FormItem>
                  <FormLabel>Archivos STL</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-primary/40 rounded-lg p-6 text-center hover:border-primary transition-colors bg-gradient-to-br from-primary/20 to-transparent dark:from-primary/20 dark:to-transparent">
                      <input
                        type="file"
                        accept=".stl"
                        onChange={handleFileChange}
                        className="hidden"
                        id="stl-file-input"
                        multiple
                        data-testid="input-stl-file"
                      />
                      <label
                        htmlFor="stl-file-input"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {fileNames.length > 0 
                            ? `${fileNames.length} archivo${fileNames.length !== 1 ? 's' : ''} seleccionado${fileNames.length !== 1 ? 's' : ''}`
                            : "Haz clic para seleccionar hasta 10 archivos STL"
                          }
                        </span>
                      </label>
                      {fileNames.length > 0 && (
                        <div className="mt-4 text-left">
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {fileNames.map((name, idx) => (
                              <li key={idx}>✓ {name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Formatos aceptados: .stl (máximo 10 archivos, 50MB cada uno)
                  </FormDescription>
                </FormItem>

                {/* Project Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Proyecto</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Prototipo de engranaje mecánico" 
                          {...field} 
                          data-testid="input-project-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe los detalles de tu proyecto, tolerancias, acabado requerido, etc."
                          className="min-h-24"
                          {...field}
                          data-testid="input-project-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Material */}
                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Preferido</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-material">
                            <SelectValue placeholder="Selecciona el material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PLA">PLA</SelectItem>
                          <SelectItem value="ABS">ABS</SelectItem>
                          <SelectItem value="PETG">PETG</SelectItem>
                          <SelectItem value="TPU">TPU</SelectItem>
                          <SelectItem value="Nylon">Nylon</SelectItem>
                          <SelectItem value="Resina">Resina</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dimensions */}
                <div className="space-y-3">
                  <FormLabel>Dimensiones (mm)</FormLabel>
                  <p className="text-sm text-muted-foreground">Las medidas máximas del objeto más grande</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                        X (Largo)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="z-[9999]">
                            <p>Dimensión a lo largo del eje X (izquierda-derecha)</p>
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <Input
                        type="number"
                        placeholder="ej: 100"
                        value={(form.watch("specifications") as any)?.dimensionX || ""}
                        onChange={(e) =>
                          form.setValue("specifications", {
                            ...((form.getValues("specifications") || {}) as any),
                            dimensionX: e.target.value,
                          })
                        }
                        data-testid="input-dimension-x"
                        className="font-mono"
                      />
                      {form.formState.errors.specifications && (
                        <p className="text-xs text-red-600 mt-1">Requerido</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                        Y (Ancho)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="z-[9999]">
                            <p>Dimensión a lo ancho del eje Y (adelante-atrás)</p>
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <Input
                        type="number"
                        placeholder="ej: 100"
                        value={(form.watch("specifications") as any)?.dimensionY || ""}
                        onChange={(e) =>
                          form.setValue("specifications", {
                            ...((form.getValues("specifications") || {}) as any),
                            dimensionY: e.target.value,
                          })
                        }
                        data-testid="input-dimension-y"
                        className="font-mono"
                      />
                      {form.formState.errors.specifications && (
                        <p className="text-xs text-red-600 mt-1">Requerido</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                        Z (Alto)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="z-[9999]">
                            <p>Dimensión altura del eje Z (arriba-abajo)</p>
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <Input
                        type="number"
                        placeholder="ej: 100"
                        value={(form.watch("specifications") as any)?.dimensionZ || ""}
                        onChange={(e) =>
                          form.setValue("specifications", {
                            ...((form.getValues("specifications") || {}) as any),
                            dimensionZ: e.target.value,
                          })
                        }
                        data-testid="input-dimension-z"
                        className="font-mono"
                      />
                      {form.formState.errors.specifications && (
                        <p className="text-xs text-red-600 mt-1">Requerido</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                    data-testid="button-back-upload"
                  >
                    ← Atrás
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="flex-1"
                    data-testid="button-submit-project"
                  >
                    {mutation.isPending ? "Publicando..." : "Publicar Proyecto"}
                  </Button>
                </div>

                {form.formState.errors && Object.keys(form.formState.errors).length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    <p className="text-sm text-red-700 dark:text-red-400 font-semibold">Errores de validación:</p>
                    <ul className="text-sm text-red-600 dark:text-red-300 mt-1 space-y-1">
                      {Object.entries(form.formState.errors).map(([field, error]: any) => (
                        <li key={field}>• {field}: {error?.message || "Error desconocido"}</li>
                      ))}
                    </ul>
                  </div>
                )}
                </form>
              </Form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
