import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Euro } from "lucide-react";
import type { MarketplaceDesign } from "@shared/schema";

export default function MarketplaceDesignDetailPage() {
  const [match, params] = useRoute("/marketplace-design/:designId");
  const [, setLocation] = useLocation();
  const designId = params?.designId;

  const { data: design, isLoading, error } = useQuery<any>({
    queryKey: ["/api/marketplace-design", designId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace-designs/${designId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch design");
      return res.json();
    },
    enabled: !!designId,
  });

  const { data: maker } = useQuery({
    queryKey: ["/api/user", design?.makerId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${design?.makerId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!design?.makerId,
  });

  if (!match) return null;
  if (isLoading) return <div className="p-4">Cargando...</div>;
  if (error || !design) return <div className="p-4">Diseño no encontrado</div>;

  const makerInitial = maker?.username?.[0]?.toUpperCase() || "M";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/chats")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{design.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {design.imageUrl && (
              <div className="aspect-square w-full bg-muted rounded-lg overflow-hidden">
                <img
                  src={design.imageUrl}
                  alt={design.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Descripción</h3>
              <p className="text-muted-foreground">{design.description}</p>
            </div>

            <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Precio</p>
                <p className="text-2xl font-bold flex items-center">
                  <Euro className="h-6 w-6" />
                  {Number(design.price).toFixed(2)}
                </p>
              </div>
            </div>

            {maker && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Maker</h3>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={maker.profileImageUrl} />
                    <AvatarFallback className="text-lg">
                      {makerInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{maker.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {maker.firstName} {maker.lastName}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
