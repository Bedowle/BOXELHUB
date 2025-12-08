import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMarketplaceDesignSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Upload, Edit2, X, MessageCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MakerMarketplaceUpload() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch user's designs
  const { data: designs = [], isLoading } = useQuery({
    queryKey: ['/api/my-designs'],
    queryFn: async () => {
      const res = await fetch('/api/my-designs');
      if (!res.ok) throw new Error('Failed to fetch designs');
      return res.json();
    },
  });

  // Upload/Update design mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        return apiRequest('PUT', `/api/marketplace/designs/${editingId}`, data);
      }
      return apiRequest('POST', '/api/marketplace/designs', data);
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: editingId ? "Diseño actualizado correctamente" : "Diseño subido correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/my-designs'] });
      form.reset();
      setEditingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el diseño",
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
      price: "0.00",
      material: "PLA",
      priceType: "fixed",
    },
  });

  const priceType = form.watch("priceType");

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      form.setValue("imageUrl", e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSTLUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      form.setValue("stlFileContent", e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: any) => {
    // If free, set price to 0
    if (data.priceType === "free") {
      data.price = "0.00";
    }
    
    // Validate price for minimum type
    if (data.priceType === "minimum") {
      const price = parseFloat(data.price) || 0;
      // If minimum price > 0, it must be at least 0.5
      if (price > 0 && price < 0.5) {
        toast({
          title: "Precio inválido",
          description: "El precio mínimo debe ser 0€ (gratis) o al menos €0.50",
          variant: "destructive",
        });
        return;
      }
    }
    
    uploadMutation.mutate(data);
  };

  const handleEditDesign = (design: any) => {
    setEditingId(design.id);
    form.reset({
      title: design.title,
      description: design.description,
      imageUrl: design.imageUrl,
      price: String(design.price),
      material: design.material,
      priceType: design.priceType || "fixed",
    });
    // Scroll to form
    document.querySelector('.sticky')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5">
      {/* Header */}
      <div className="border-b border-border/50 sticky top-0 z-40 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => window.history.back()}
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
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{editingId ? "Editar Diseño" : "Subir Diseño"}</CardTitle>
                    <CardDescription>
                      {editingId ? "Actualiza los detalles del diseño" : "Añade un nuevo diseño a tu tienda"}
                    </CardDescription>
                  </div>
                  {editingId && (
                    <button
                      onClick={handleCancelEdit}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-cancel-edit"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
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
                          <FormLabel>Imagen del Diseño</FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(file);
                                  }
                                }}
                                className="hidden"
                                id="image-upload"
                                data-testid="input-design-image"
                              />
                              <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload className="w-6 h-6 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {field.value ? "Imagen cargada ✓" : "Haz clic para subir imagen"}
                                </span>
                                <span className="text-xs text-muted-foreground">PNG, JPG, WEBP</span>
                              </label>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Precio</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-price-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="free">Gratis</SelectItem>
                              <SelectItem value="fixed">Precio Fijo</SelectItem>
                              <SelectItem value="minimum">Precio Mínimo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {priceType === "free" && "El diseño estará disponible sin costo"}
                            {priceType === "fixed" && "Los compradores pagan exactamente el precio que estableces"}
                            {priceType === "minimum" && "Los compradores pueden pagar igual o más del precio mínimo"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {priceType !== "free" && (
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => {
                          const priceValue = parseFloat(field.value) || 0;
                          const isMinimumZero = priceType === "minimum" && priceValue === 0;
                          
                          return (
                            <FormItem>
                              <FormLabel>
                                {priceType === "fixed" ? "Precio (€)" : "Precio Mínimo (€)"}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={priceType === "minimum" && priceValue > 0 ? "0.5" : "0"}
                                  placeholder={priceType === "fixed" ? "10.00" : "5.00"}
                                  {...field}
                                  data-testid="input-design-price"
                                />
                              </FormControl>
                              {isMinimumZero && (
                                <div className="text-xs bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100 p-2 rounded border border-amber-200 dark:border-amber-800">
                                  Los compradores pueden descargar gratis o pagar lo que quieran (mínimo €0.50 si contribuyen)
                                </div>
                              )}
                              {priceType === "minimum" && priceValue > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  Los compradores pueden pagar desde €{priceValue.toFixed(2)} en adelante
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    )}

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
                      name="stlFileContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Archivo STL</FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                              <input
                                type="file"
                                accept=".stl"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleSTLUpload(file);
                                  }
                                }}
                                className="hidden"
                                id="stl-upload"
                                data-testid="input-design-stl"
                              />
                              <label htmlFor="stl-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload className="w-6 h-6 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {field.value ? "STL cargado ✓" : "Haz clic para subir STL"}
                                </span>
                                <span className="text-xs text-muted-foreground">Archivo .stl</span>
                              </label>
                            </div>
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
                      {uploadMutation.isPending ? (editingId ? "Actualizando..." : "Subiendo...") : (
                        <>
                          {editingId ? (
                            <>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Actualizar Diseño
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Subir Diseño
                            </>
                          )}
                        </>
                      )}
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
                                  <span className="text-muted-foreground">
                                    {design.priceType === "free" ? "Precio: " : design.priceType === "fixed" ? "Precio Fijo: " : "Precio Mínimo: "}
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {design.priceType === "free" ? "Gratis" : `€${parseFloat(String(design.price)).toFixed(2)}`}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Material: </span>
                                  <span>{design.material}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLocation(`/marketplace-design-chats/${design.id}`)}
                                data-testid="button-view-design-chats"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditDesign(design)}
                                data-testid="button-edit-design"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
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
