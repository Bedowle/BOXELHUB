import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Trash2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import type { User, MakerProfile, Review } from "@shared/schema";
import { PrinterCombobox } from "@/components/PrinterCombobox";

const profileEditSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  location: z.string().optional(),
  showFullName: z.boolean().default(false),
});

const makerProfileEditSchema = z.object({
  printerType: z.string().min(1, "Printer type is required"),
  materials: z.array(z.string()).default([]),
  maxPrintDimensionX: z.number().optional(),
  maxPrintDimensionY: z.number().optional(),
  maxPrintDimensionZ: z.number().optional(),
  hasMulticolor: z.boolean().default(false),
  maxColors: z.number().optional(),
  location: z.string().optional(),
  addressStreetType: z.string().optional(),
  addressStreetName: z.string().optional(),
  addressNumber: z.string().optional(),
  addressPostalCode: z.string().optional(),
  capabilities: z.string().optional(),
  showFullName: z.boolean().default(false),
});

type ProfileEditForm = z.infer<typeof profileEditSchema>;
type MakerProfileEditForm = z.infer<typeof makerProfileEditSchema>;


const MATERIALS = [
  "PLA", "PETG", "ABS", "TPU", "Nylon", "Resina", "Fibra de Carbono", "TPE Flexible", "Aluminio Relleno", "Madera Rellena", "Acero", "Titanio", "Cobre", "Policarbonato", "PEEK", "Poliestireno"
];

export default function UserProfilePage() {
  const [match, params] = useRoute("/user/:userId");
  const [, setLocation] = useLocation();
  const userId = params?.userId;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${userId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: makerProfile } = useQuery<MakerProfile | null>({
    queryKey: ["/api/maker", userId],
    queryFn: async () => {
      const res = await fetch(`/api/maker/${userId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!userId && user?.userType === "maker",
  });

  // Load reviews for any user to calculate rating
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/makers", userId, "reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/makers/${userId}/reviews`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId,
  });

  // Calculate review count and average rating
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 
    ? reviews.reduce((sum, r) => sum + parseFloat(String(r.rating || 0)), 0) / reviewCount 
    : 0;

  const isOwnProfile = currentUser?.id === userId;

  // Client form
  const form = useForm<ProfileEditForm>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      location: "",
    },
  });

  // Maker form
  const makerForm = useForm<MakerProfileEditForm>({
    resolver: zodResolver(makerProfileEditSchema),
    defaultValues: {
      printerType: "",
      materials: [],
      location: "",
      capabilities: "",
    },
  });

  // Update form values when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        location: user.location || "",
        showFullName: user.showFullName || false,
      });
    }
  }, [user, form]);

  // Update maker form when maker profile loads
  useEffect(() => {
    if (makerProfile && user) {
      makerForm.reset({
        printerType: makerProfile.printerType || "",
        materials: makerProfile.materials || [],
        maxPrintDimensionX: makerProfile.maxPrintDimensionX || undefined,
        maxPrintDimensionY: makerProfile.maxPrintDimensionY || undefined,
        maxPrintDimensionZ: makerProfile.maxPrintDimensionZ || undefined,
        hasMulticolor: makerProfile.hasMulticolor || false,
        maxColors: makerProfile.maxColors || undefined,
        location: makerProfile.location || "",
        addressStreetType: makerProfile.addressStreetType || "",
        addressStreetName: makerProfile.addressStreetName || "",
        addressNumber: makerProfile.addressNumber || "",
        addressPostalCode: makerProfile.addressPostalCode || "",
        capabilities: makerProfile.capabilities || "",
        showFullName: user.showFullName || false,
      });
    }
  }, [makerProfile, makerForm, user]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileEditForm) => {
      const res = await fetch(`/api/user/${userId}/profile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Profile updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Maker profile update mutation
  const updateMakerProfileMutation = useMutation({
    mutationFn: async (data: MakerProfileEditForm) => {
      return apiRequest("PUT", "/api/maker-profile", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Maker profile updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/maker", userId] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Profile image upload mutation
  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;

            const res = await fetch(`/api/user/${userId}/profile-image`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profileImageUrl: base64 }),
            });

            if (!res.ok) {
              const error = await res.json();
              throw new Error(error.message || "Failed to upload image");
            }

            resolve(res.json());
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Profile image updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      uploadProfileImageMutation.mutate(file);
    }
  };

  const onClientSubmit = (data: ProfileEditForm) => {
    updateProfileMutation.mutate(data);
  };

  const onMakerSubmit = (data: MakerProfileEditForm) => {
    updateMakerProfileMutation.mutate(data);
  };

  const handleAddMaterial = (material: string) => {
    const current = makerForm.getValues("materials");
    if (!current.includes(material)) {
      makerForm.setValue("materials", [...current, material]);
    }
  };

  const handleRemoveMaterial = (material: string) => {
    const current = makerForm.getValues("materials");
    makerForm.setValue("materials", current.filter(m => m !== material));
  };

  if (!match) return null;
  if (isLoading) return <div className="p-4">Cargando...</div>;
  if (error || !user) return <div className="p-4">Usuario no encontrado</div>;

  const userInitial = user.username?.[0]?.toUpperCase() || "U";
  const isMaker = user.userType === "maker";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back-profile"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-start gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors"
                  data-testid="button-upload-avatar"
                >
                  <Upload className="h-4 w-4" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploadProfileImageMutation.isPending}
              />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{user.username}</CardTitle>
              {user.showFullName && (
                <p className="text-sm text-muted-foreground mt-2">
                  {user.firstName} {user.lastName}
                </p>
              )}

              {/* Rating */}
              {reviewCount > 0 && (
                <div className="flex items-center gap-4 flex-wrap mt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => {
                        const rating = averageRating;
                        return (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : i < rating
                                ? "fill-yellow-400 text-yellow-400 opacity-50"
                                : "text-muted-foreground"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="font-semibold text-lg">
                      {averageRating.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/user/${userId}/reviews`)}
                    data-testid="button-view-reviews"
                  >
                    {reviewCount} reseña{reviewCount !== 1 ? "s" : ""}
                  </Button>
                </div>
              )}

              {isOwnProfile && (
                <div className="mt-4">
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      data-testid="button-edit-profile"
                    >
                      Editar Perfil
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset();
                        makerForm.reset();
                      }}
                      data-testid="button-cancel-editing"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing && isOwnProfile && isMaker && makerProfile ? (
              // Maker profile edit form
              <Form {...makerForm}>
                <form onSubmit={makerForm.handleSubmit(onMakerSubmit)} className="space-y-4">
                  <FormField
                    control={makerForm.control}
                    name="printerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Impresora</FormLabel>
                        <FormControl>
                          <PrinterCombobox
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Busca o escribe tu impresora..."
                            testId="select-printerType"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={makerForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Ciudad, País" {...field} data-testid="input-makerLocation" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Materiales</FormLabel>
                    <div>
                      <Select onValueChange={(value) => {
                        if (value) {
                          handleAddMaterial(value);
                        }
                      }}>
                        <SelectTrigger data-testid="select-materials">
                          <SelectValue placeholder="Selecciona un material" />
                        </SelectTrigger>
                        <SelectContent>
                          {MATERIALS.filter(m => !makerForm.watch("materials").includes(m)).map(material => (
                            <SelectItem key={material} value={material}>{material}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {makerForm.watch("materials").length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {makerForm.watch("materials").map((material, idx) => (
                          <div
                            key={idx}
                            className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                            data-testid={`badge-material-${idx}`}
                          >
                            {material}
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(material)}
                              className="ml-1"
                              data-testid={`button-remove-material-${idx}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={makerForm.control}
                      name="maxPrintDimensionX"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max X (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="X"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              data-testid="input-maxX"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={makerForm.control}
                      name="maxPrintDimensionY"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Y (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Y"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              data-testid="input-maxY"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={makerForm.control}
                      name="maxPrintDimensionZ"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Z (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Z"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              data-testid="input-maxZ"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={makerForm.control}
                    name="hasMulticolor"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-multicolor"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">
                          Multicolor
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {makerForm.watch("hasMulticolor") && (
                    <FormField
                      control={makerForm.control}
                      name="maxColors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máximo de Colores</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Número de colores"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              data-testid="input-maxColors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={makerForm.control}
                    name="capabilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Impresión rápida, acabados de calidad..."
                            {...field}
                            data-testid="input-capabilities"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={makerForm.control}
                    name="showFullName"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-show-full-name-maker" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Mostrar nombre completo en mi perfil</FormLabel>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={updateMakerProfileMutation.isPending}
                      data-testid="button-save-maker-profile"
                    >
                      {updateMakerProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : isEditing && isOwnProfile ? (
              // Client profile edit form
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onClientSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre" {...field} data-testid="input-firstName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Apellido" {...field} data-testid="input-lastName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Ubicación (opcional)" {...field} data-testid="input-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showFullName"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-show-full-name" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Mostrar nombre completo en mi perfil</FormLabel>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </div>

                  {uploadProfileImageMutation.isPending && (
                    <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
                  )}
                </form>
              </Form>
            ) : (
              // View mode
              <div className="space-y-4">
                {user.location && (
                  <div>
                    <h3 className="font-semibold text-sm">Ubicación</h3>
                    <p className="text-sm text-muted-foreground">{user.location}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-sm">Tipo de usuario</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {user.userType === "client" ? "Cliente" : "Maker"}
                  </p>
                </div>

                {isMaker && makerProfile && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold">Detalles del Maker</h3>

                    {makerProfile.printerType && (
                      <div>
                        <p className="text-sm font-medium">Tipo de Impresora</p>
                        <p className="text-sm text-muted-foreground">{makerProfile.printerType}</p>
                      </div>
                    )}

                    {makerProfile.materials?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium">Materiales</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {makerProfile.materials.map((m, idx) => (
                            <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {makerProfile.maxPrintDimensionX && (
                      <div>
                        <p className="text-sm font-medium">Dimensiones Máximas</p>
                        <p className="text-sm text-muted-foreground">
                          {makerProfile.maxPrintDimensionX} x {makerProfile.maxPrintDimensionY} x {makerProfile.maxPrintDimensionZ} mm
                        </p>
                      </div>
                    )}

                    {makerProfile.hasMulticolor && (
                      <div>
                        <p className="text-sm font-medium">Multicolor</p>
                        <p className="text-sm text-muted-foreground">
                          Hasta {makerProfile.maxColors} colores
                        </p>
                      </div>
                    )}

                    {makerProfile.capabilities && (
                      <div>
                        <p className="text-sm font-medium">Descripción</p>
                        <p className="text-sm text-muted-foreground">{makerProfile.capabilities}</p>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
