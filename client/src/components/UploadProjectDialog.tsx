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
import { Upload } from "lucide-react";

interface UploadProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadProjectDialog({ open, onOpenChange }: UploadProjectDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState("");

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      stlFileName: "",
      description: "",
      material: "",
      specifications: {},
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      await apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      toast({
        title: "Proyecto creado",
        description: "Tu proyecto ha sido publicado. Los makers comenzarán a enviar ofertas pronto.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      form.reset();
      setFileName("");
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
        description: error.message || "No se pudo crear el proyecto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProject) => {
    mutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      form.setValue("stlFileName", file.name);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir Nuevo Proyecto STL</DialogTitle>
          <DialogDescription>
            Completa los detalles de tu proyecto para que los makers puedan enviar ofertas precisas
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload */}
            <FormItem>
              <FormLabel>Archivo STL</FormLabel>
              <FormControl>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept=".stl"
                    onChange={handleFileChange}
                    className="hidden"
                    id="stl-file-input"
                    data-testid="input-stl-file"
                  />
                  <label
                    htmlFor="stl-file-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {fileName || "Haz clic para seleccionar un archivo STL"}
                    </span>
                  </label>
                </div>
              </FormControl>
              <FormDescription>
                Formatos aceptados: .stl (máximo 50MB)
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel-upload"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !fileName}
                className="flex-1"
                data-testid="button-submit-project"
              >
                {mutation.isPending ? "Subiendo..." : "Publicar Proyecto"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
