import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { ArrowLeft, Search, Sparkles, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Design {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  material: string;
  printerType: string;
  estimatedPrintTime?: number;
  estimatedWeight?: string;
  makerId: string;
  maker: any;
  makerProfile: any;
}

interface DesignCardProps {
  design: Design;
  setLocation: (path: string) => void;
  user: any;
}

function DesignCard({ design, setLocation, user }: DesignCardProps) {
  // Check if user has access to this design
  const { data: accessInfo } = useQuery({
    queryKey: [`/api/marketplace/designs/${design.id}/access`],
    enabled: !!user,
  });

  const canAccess = accessInfo?.canAccess ?? false;

  return (
    <Card className="hover-elevate overflow-hidden flex flex-col h-full">
      {/* Image */}
      {design.imageUrl && (
        <div className="relative overflow-hidden bg-muted h-48">
          <img
            src={design.imageUrl}
            alt={design.title}
            className="w-full h-full object-cover"
            data-testid={`img-design-${design.id}`}
          />
        </div>
      )}

      <CardContent className="pt-4 flex-1 flex flex-col">
        {/* Maker Info */}
        <button
          onClick={() => design.makerId && setLocation(`/user/${design.makerId}`)}
          className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50 hover-elevate rounded p-1 transition-colors w-full text-left"
          data-testid={`button-view-maker-${design.id}`}
        >
          {design.maker?.profileImageUrl && (
            <img
              src={design.maker.profileImageUrl}
              alt={design.maker.username}
              className="w-6 h-6 rounded-full bg-muted"
              data-testid={`img-maker-avatar-${design.id}`}
            />
          )}
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Por</p>
            <p className="text-sm font-medium" data-testid={`text-maker-name-${design.id}`}>
              {design.maker?.username || "Anónimo"}
            </p>
          </div>
          {design.makerProfile?.rating && (
            <Badge variant="outline" className="text-xs">
              ⭐ {parseFloat(String(design.makerProfile.rating)).toFixed(1)}
            </Badge>
          )}
        </button>

        {/* Title & Description */}
        <h3 className="font-semibold text-lg mb-1 line-clamp-2" data-testid={`text-design-title-${design.id}`}>
          {design.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {design.description}
        </p>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="bg-secondary/50 rounded p-2">
            <p className="text-muted-foreground">Material</p>
            <p className="font-medium">{design.material}</p>
          </div>
          <div className="bg-secondary/50 rounded p-2">
            <p className="text-muted-foreground">Impresora</p>
            <p className="font-medium">{design.printerType}</p>
          </div>
          {design.estimatedPrintTime && (
            <div className="bg-secondary/50 rounded p-2">
              <p className="text-muted-foreground">Tiempo</p>
              <p className="font-medium">{design.estimatedPrintTime}h</p>
            </div>
          )}
          {design.estimatedWeight && (
            <div className="bg-secondary/50 rounded p-2">
              <p className="text-muted-foreground">Peso</p>
              <p className="font-medium">{design.estimatedWeight}g</p>
            </div>
          )}
        </div>

        {/* Price & CTA */}
        <div className="mt-auto pt-4 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Precio</p>
              <p className="text-2xl font-bold text-primary" data-testid={`text-price-${design.id}`}>
                {design.priceType === "free" ? "Gratis" : `€${parseFloat(String(design.price)).toFixed(2)}`}
              </p>
            </div>
            {design.priceType && (
              <Badge variant="outline" className="text-xs">
                {design.priceType === "free"
                  ? "Gratis"
                  : design.priceType === "fixed"
                    ? "Fijo"
                    : "Mínimo"}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {user?.id === design.makerId ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setLocation(`/maker/marketplace`)}
                data-testid={`button-edit-design-${design.id}`}
              >
                Editar
              </Button>
            ) : (
              <>
                {canAccess ? (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => setLocation(`/marketplace-design/${design.id}`)}
                    data-testid={`button-view-design-${design.id}`}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => setLocation(`/marketplace-design/${design.id}`)}
                    data-testid={`button-buy-design-${design.id}`}
                  >
                    Comprar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLocation(`/chat/${design.makerId}?marketplaceDesignId=${design.id}`)}
                  data-testid={`button-contact-maker-${design.id}`}
                >
                  Contactar
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientMarketplace() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  // Fetch marketplace designs
  const { data: designs = [], isLoading } = useQuery({
    queryKey: ['/api/marketplace/designs'],
    queryFn: async () => {
      const res = await fetch('/api/marketplace/designs');
      if (!res.ok) throw new Error('Failed to fetch designs');
      return res.json();
    },
  });

  // Filter designs based on search
  const filteredDesigns = useMemo(() => {
    return designs.filter((design: Design) => {
      const query = searchQuery.toLowerCase();
      return (
        design.title.toLowerCase().includes(query) ||
        design.description.toLowerCase().includes(query) ||
        design.material.toLowerCase().includes(query) ||
        design.maker?.username?.toLowerCase().includes(query)
      );
    });
  }, [designs, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5">
      {/* Header */}
      <div className="border-b border-border/50 sticky top-0 z-40 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            data-testid="button-back-to-client"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Explorar Diseños</h1>
          </div>
          <p className="text-muted-foreground">
            Descubre diseños de calidad de makers verificados. Sin necesidad de subir archivos, solo solicita la impresión.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, material, maker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
              data-testid="input-search-designs"
            />
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Cargando..." : `${filteredDesigns.length} diseño${filteredDesigns.length !== 1 ? "s" : ""} disponible${filteredDesigns.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Designs Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando diseños...</p>
            </div>
          </div>
        ) : filteredDesigns.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-16">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-lg mb-2">No se encontraron diseños</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Intenta con otros términos de búsqueda"
                    : "Los makers están preparando sus diseños"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDesigns.map((design: Design) => (
              <DesignCard key={design.id} design={design} setLocation={setLocation} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
