import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useRef, useState } from "react";
import type { User } from "@shared/schema";

export default function UserProfilePage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/user/:userId");
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

  const isOwnProfile = currentUser?.id === userId;

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

  if (!match) return null;
  if (isLoading) return <div className="p-4">Cargando...</div>;
  if (error || !user) return <div className="p-4">Usuario no encontrado</div>;

  const userInitial = user.username?.[0]?.toUpperCase() || "U";

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
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {user.firstName} {user.lastName}
              </p>
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
                      onClick={() => setIsEditing(false)}
                      data-testid="button-done-editing"
                    >
                      Listo
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
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
              {isEditing && isOwnProfile && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Haz click en el ícono de cámara en tu foto de perfil para cambiarla
                  </p>
                  {uploadProfileImageMutation.isPending && (
                    <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
