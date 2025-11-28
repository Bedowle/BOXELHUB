import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { ArrowLeft, Zap, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Project } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function MakerBidsList() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: myBids, isLoading: bidsLoading } = useQuery<(any & { project?: Project })[]>({
    queryKey: ["/api/bids/my-bids"],
    enabled: !!user,
  });

  if (!authLoading && !user) {
    toast({
      title: "No autorizado",
      description: "Iniciando sesión...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const activeBids = myBids?.filter(b => b.status === "pending" && !b.project?.deletedAt) || [];
  const acceptedBids = myBids?.filter(b => b.status === "accepted") || [];
  // Include explicitly rejected AND pending bids from deleted projects (treated as rejected)
  const rejectedBids = myBids?.filter(b => b.status === "rejected" || (b.status === "pending" && b.project?.deletedAt)) || [];
  const inactiveBids = [...(acceptedBids || []), ...(rejectedBids || [])];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-100/40 dark:via-purple-950/40 to-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 bg-gradient-to-r from-purple-600/15 via-secondary/15 to-primary/15 dark:from-purple-500/25 dark:via-secondary/25 dark:to-primary/25 rounded-2xl p-8 border-2 border-secondary/50 dark:border-secondary/60">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-secondary to-primary bg-clip-text text-transparent dark:from-purple-300 dark:via-secondary dark:to-primary">Mis Ofertas Activas</h1>
          <p className="text-muted-foreground">
            {activeBids.length} oferta{activeBids.length !== 1 ? "s" : ""}
          </p>
        </div>

        {bidsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6 pb-6 h-24" />
              </Card>
            ))}
          </div>
        ) : activeBids.length > 0 ? (
          <div className="space-y-4">
            {activeBids.map((bid) => (
              <Card 
                key={bid.id}
                className="border-2 border-primary/60 hover-elevate cursor-pointer bg-gradient-to-br from-primary/20 to-blue-100/30 dark:from-primary/30 dark:to-blue-900/20 shadow-md"
                onClick={() => setLocation(`/project/${bid.projectId}`)}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{bid.project?.name}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{bid.project?.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Publicado {formatDistanceToNow(new Date(bid.project?.createdAt || new Date()), { locale: es, addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/40 dark:bg-primary/50 px-3 py-2 rounded-lg">
                      <Zap className="h-5 w-5 text-primary" />
                      <span className="font-bold text-primary">Activa</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Zap}
            title="No has hecho ninguna oferta"
            description="No tienes ofertas pendientes en este momento"
          />
        )}

        {/* Inactive Bids History */}
        {inactiveBids.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Histórico de Ofertas</h2>
            <div className="space-y-4">
              {acceptedBids?.map((bid) => (
                <Card 
                  key={`accepted-${bid.id}`}
                  className="hover-elevate cursor-pointer opacity-75"
                  onClick={() => setLocation(`/project/${bid.projectId}`)}
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{bid.project?.name}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{bid.project?.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Publicado {formatDistanceToNow(new Date(bid.project?.createdAt || new Date()), { locale: es, addSuffix: true })}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Aceptada
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {rejectedBids?.map((bid) => (
                <Card 
                  key={`rejected-${bid.id}`}
                  className="hover-elevate cursor-pointer opacity-75"
                  onClick={() => setLocation(`/project/${bid.projectId}`)}
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{bid.project?.name}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{bid.project?.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Publicado {formatDistanceToNow(new Date(bid.project?.createdAt || new Date()), { locale: es, addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-4 w-4" />
                        Rechazada
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
