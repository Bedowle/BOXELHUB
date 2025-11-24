import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMarketplaceDesignSchema, printerTypeEnum } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function MakerMarketplaceUpload() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch user's designs
  const { data: designs = [], isLoading } = useQuery({
    queryKey: ['/api/my-designs'],
    queryFn: async () => {
      const res = await fetch('/api/my-designs');
      if (!res.ok) throw new Error('Failed to fetch designs');
      return res.json();
    },
  });

  // Upload design mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/marketplace/designs', data);
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Diseño subido correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/my-designs'] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el diseño",
        variant: "destructive",
      });
    },
  });

  // Delete design mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/marketplace/designs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Diseño eliminado",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/my-designs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el diseño",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertMarketplaceDesignSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      price: "10.00",
      material: "PLA",
      printerType: "Ender3",
      estimatedPrintTime: undefined,
      estimatedWeight: "",
    },
  });

  const onSubmit = async (data: any) => {
    uploadMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5">
      {/* Header */}
      <div className="border-b border-border/50 sticky top-0 z-40 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => setLocation("/maker")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            data-testid="button-back-to-maker"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <h1 className="text-3xl font-bold">Mi Tienda de Diseños</h1>
          <p className="text-muted-foreground mt-2">
            Sube tus diseños 3D para que los clientes los compren directamente
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Subir Diseño</CardTitle>
                <CardDescription>Añade un nuevo diseño a tu tienda</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="P. ej. Maceta Moderna" {...field} data-testid="input-design-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe tu diseño..."
                              className="resize-none"
                              rows={3}
                              {...field}
                              data-testid="textarea-design-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de Imagen</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://ejemplo.com/imagen.jpg"
                              {...field}
                              data-testid="input-design-image"
                            />
                          </FormControl>
                          <FormDescription>
                            Link a una imagen del diseño
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio (€)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="10.00"
                              {...field}
                              data-testid="input-design-price"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="material"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="PLA"
                              {...field}
                              data-testid="input-design-material"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="printerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Impresora</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-printer-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Ender3">Ender3</SelectItem>
                              <SelectItem value="BambooLab">BambooLab</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedPrintTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiempo de Impresión (horas)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Opcional"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              data-testid="input-design-print-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso Estimado (g)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Opcional"
                              {...field}
                              data-testid="input-design-weight"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={uploadMutation.isPending}
                      data-testid="button-submit-design"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {uploadMutation.isPending ? "Subiendo..." : "Subir Diseño"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Designs List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Cargando diseños...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : designs.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        Aún no has subido ningún diseño
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Completa el formulario a la izquierda para crear tu primer diseño
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                designs.map((design: any) => (
                  <Card key={design.id} className="hover-elevate">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {design.imageUrl && (
                          <div className="sm:col-span-1">
                            <img
                              src={design.imageUrl}
                              alt={design.title}
                              className="w-full h-40 object-cover rounded-md bg-muted"
                              data-testid="img-design-thumbnail"
                            />
                          </div>
                        )}
                        <div className="sm:col-span-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1" data-testid="text-design-title">
                                {design.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {design.description}
                              </p>
                              <div className="flex flex-wrap gap-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Precio: </span>
                                  <span className="font-semibold text-primary">
                                    €{parseFloat(String(design.price)).toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Material: </span>
                                  <span>{design.material}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Impresora: </span>
                                  <span>{design.printerType}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(design.id)}
                              disabled={deleteMutation.isPending}
                              data-testid="button-delete-design"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
