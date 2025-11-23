import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MakerProfileDialog } from "@/components/MakerProfileDialog";
import { ArrowLeft, Edit2, Star, Printer } from "lucide-react";
import type { MakerProfile } from "@shared/schema";

export default function MakerProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<MakerProfile>({
    queryKey: ["/api/maker-profile"],
    enabled: !!user,
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/maker")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        {/* Profile Header Card */}
        <Card className="mb-8 border-2 border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:via-transparent dark:to-secondary/10">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Avatar */}
              <Avatar className="h-24 w-24 flex-shrink-0">
                <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || "User"} />
                <AvatarFallback className="text-2xl">
                  {(user.firstName || "U").charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl font-bold mb-1">{user.firstName || "Mi Perfil"}</h1>
                  <p className="text-muted-foreground">@{user.email}</p>
                </div>

                {/* Rating */}
                {profile && (
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(profile.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : i < (profile.rating || 0)
                                ? "fill-yellow-400 text-yellow-400 opacity-50"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-lg">
                        {((profile.rating || 0) as number).toFixed(2)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation("/maker/reviews")}
                      data-testid="button-view-reviews"
                    >
                      {profile.totalReviews || 0} reseña{(profile.totalReviews || 0) !== 1 ? "s" : ""}
                    </Button>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <Button
                onClick={() => setProfileDialogOpen(true)}
                className="gap-2"
                data-testid="button-edit-profile"
              >
                <Edit2 className="h-4 w-4" />
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Printer Details */}
        {profile && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Printer Info Card */}
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Printer className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Impresora</h2>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{profile.printerType}</span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Materiales:</span>
                      <div className="text-right">
                        {profile.materials && profile.materials.length > 0 ? (
                          <div className="space-y-1">
                            {profile.materials.map((material) => (
                              <Badge key={material} variant="outline" className="text-xs">
                                {material}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="font-medium">No especificado</span>
                        )}
                      </div>
                    </div>

                    {profile.hasMulticolor && (
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground">Multicolor:</span>
                        <Badge className="text-xs">Sí</Badge>
                      </div>
                    )}

                    {profile.maxColors && profile.maxColors > 1 && (
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground">Máx. Colores:</span>
                        <span className="font-medium">{profile.maxColors}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dimensions Card */}
            {(profile.maxPrintDimensionX || profile.maxPrintDimensionY || profile.maxPrintDimensionZ) && (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Dimensiones Máximas</h2>

                    <div className="space-y-3 text-sm">
                      {profile.maxPrintDimensionX && (
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Ancho (X):</span>
                          <span className="font-medium">{profile.maxPrintDimensionX} mm</span>
                        </div>
                      )}

                      {profile.maxPrintDimensionY && (
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Profundidad (Y):</span>
                          <span className="font-medium">{profile.maxPrintDimensionY} mm</span>
                        </div>
                      )}

                      {profile.maxPrintDimensionZ && (
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Alto (Z):</span>
                          <span className="font-medium">{profile.maxPrintDimensionZ} mm</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Card */}
            {profile.location && (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Ubicación</h2>
                    <p className="text-sm">{profile.location}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Capabilities Card */}
            {profile.capabilities && (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Capacidades</h2>
                    <p className="text-sm text-muted-foreground">{profile.capabilities}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Profile Edit Dialog */}
      <MakerProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} profile={profile || null} />
    </div>
  );
}
