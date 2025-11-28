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

  const { data: myBidProjects } = useQuery<(Project & { bidCount: number })[]>({
    queryKey: ["/api/projects/my-bids"],
    enabled: !!user,
  });

  const { data: myBids, isLoading: bidsLoading } = useQuery<{ projectId: string; status: string }[]>({
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

  const activeBids = myBidProjects?.filter(p => myBids?.some(b => b.projectId === p.id && b.status === "pending")) || [];
  const acceptedBids = myBidProjects?.filter(p => myBids?.some(b => b.projectId === p.id && b.status === "accepted")) || [];
  const rejectedBids = myBidProjects?.filter(p => myBids?.some(b => b.projectId === p.id && b.status === "rejected")) || [];
  const inactiveBids = [...(acceptedBids || []), ...(rejectedBids || [])];

  return (
    <div className="min-h-screen bg-background">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mis Ofertas Activas</h1>
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
            {activeBids.map((project) => (
              <Card 
                key={project.id}
                className="hover-elevate cursor-pointer"
                onClick={() => setLocation(`/maker/project/${project.id}`)}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{project.name}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Publicado {formatDistanceToNow(new Date(project.createdAt), { locale: es, addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
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
              {acceptedBids?.map((project) => {
                const bid = myBids?.find(b => b.projectId === project.id && b.status === "accepted");
                return (
                  <Card 
                    key={`accepted-${project.id}`}
                    className="hover-elevate cursor-pointer opacity-75"
                    onClick={() => setLocation(`/maker/project/${project.id}`)}
                  >
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{project.name}</h3>
                          <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Publicado {formatDistanceToNow(new Date(project.createdAt), { locale: es, addSuffix: true })}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Aceptada
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {rejectedBids?.map((project) => {
                const bid = myBids?.find(b => b.projectId === project.id && b.status === "rejected");
                return (
                  <Card 
                    key={`rejected-${project.id}`}
                    className="hover-elevate cursor-pointer opacity-75"
                    onClick={() => setLocation(`/maker/project/${project.id}`)}
                  >
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{project.name}</h3>
                          <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Publicado {formatDistanceToNow(new Date(project.createdAt), { locale: es, addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-4 w-4" />
                          Rechazada
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
