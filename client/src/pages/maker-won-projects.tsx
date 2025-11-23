import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { RatingDialog } from "@/components/RatingDialog";
import { ArrowLeft, Trophy, Star, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import type { Project } from "@shared/schema";

export default function MakerWonProjects() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const [deliveryStatus, setDeliveryStatus] = useState<Record<string, { deliveryConfirmed: boolean; hasRated: boolean }>>({});

  const { data: myBidProjects } = useQuery<(Project & { bidCount: number })[]>({
    queryKey: ["/api/projects/my-bids"],
    enabled: !!user,
  });

  const { data: myBids, isLoading: bidsLoading } = useQuery<{ projectId: string; status: string }[]>({
    queryKey: ["/api/bids/my-bids"],
    enabled: !!user,
  });

  // Query delivery status for all won projects
  const { data: allDeliveryStatuses } = useQuery<Record<string, { deliveryConfirmed: boolean; hasRated: boolean }>>({
    queryKey: ["/api/maker/delivery-statuses"],
    queryFn: async () => {
      const wonProjects = myBidProjects?.filter(p => myBids?.some(b => b.projectId === p.id && b.status === "accepted")) || [];
      if (wonProjects.length === 0) return {};
      
      const statuses: Record<string, { deliveryConfirmed: boolean; hasRated: boolean }> = {};
      await Promise.all(
        wonProjects.map(async (project) => {
          try {
            const response = await apiRequest("GET", `/api/projects/${project.id}/check-rating-by-maker`);
            statuses[project.id] = response;
          } catch (error) {
            console.error("Failed to check rating status:", error);
          }
        })
      );
      return statuses;
    },
    enabled: !!user && !!myBidProjects && !!myBids,
  });

  // Sync delivery statuses from query to state
  useEffect(() => {
    if (allDeliveryStatuses) {
      setDeliveryStatus(allDeliveryStatuses);
    }
  }, [allDeliveryStatuses]);

  const ratingMutation = useMutation({
    mutationFn: async (data: { projectId: string; rating: number; comment?: string }) => {
      return apiRequest("PUT", `/api/projects/${data.projectId}/rate-client-from-won-project`, {
        rating: data.rating,
        comment: data.comment,
      });
    },
    onSuccess: () => {
      toast({
        title: "Calificación enviada",
        description: "Gracias por calificar al cliente",
      });
      setRatingDialogOpen(false);
      setSelectedProjectId(null);
      if (selectedProjectId) {
        setNeedsRating(prev => {
          const next = new Set(prev);
          next.delete(selectedProjectId);
          return next;
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/projects/my-bids"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la calificación",
        variant: "destructive",
      });
    },
  });

  const checkRatingMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return apiRequest("GET", `/api/projects/${projectId}/check-rating-by-maker`);
    },
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

  const wonProjects = myBidProjects?.filter(p => myBids?.some(b => b.projectId === p.id && b.status === "accepted")) || [];

  const handleRateClick = (projectId: string, projectName: string) => {
    const status = deliveryStatus[projectId];
    if (!status?.deliveryConfirmed) {
      toast({
        title: "En espera de confirmación",
        description: "El cliente debe confirmar la entrega primero. Te notificaremos cuando lo haga.",
        variant: "default",
      });
      return;
    }
    if (status.hasRated) {
      toast({
        title: "Ya calificado",
        description: "Ya has calificado este cliente",
        variant: "default",
      });
      return;
    }
    setSelectedProjectId(projectId);
    setSelectedProjectName(projectName);
    setRatingDialogOpen(true);
  };

  const handleRatingSubmit = (rating: number, comment?: string) => {
    if (selectedProjectId) {
      ratingMutation.mutate({
        projectId: selectedProjectId,
        rating,
        comment,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/maker")}
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
          <h1 className="text-3xl font-bold mb-2">Mis Proyectos Ganados</h1>
          <p className="text-muted-foreground">
            {wonProjects.length} proyecto{wonProjects.length !== 1 ? "s" : ""}
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
        ) : wonProjects.length > 0 ? (
          <div className="space-y-4">
            {wonProjects.map((project) => {
              const status = deliveryStatus[project.id];
              const canRate = status?.deliveryConfirmed && !status?.hasRated;
              
              return (
                <Card 
                  key={project.id}
                  className={status?.deliveryConfirmed 
                    ? "border-green-200 dark:border-green-900" 
                    : "border-amber-200 dark:border-amber-900"
                  }
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div 
                        className="flex-1 hover-elevate cursor-pointer"
                        onClick={() => setLocation(`/maker/project/${project.id}`)}
                      >
                        <h3 className="font-bold text-lg">{project.name}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Publicado {formatDistanceToNow(new Date(project.createdAt), { locale: es, addSuffix: true })}
                        </p>
                        {status && (
                          <div className="mt-3 pt-3 border-t border-border">
                            {status.deliveryConfirmed ? (
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                Entrega confirmada - Puedes calificar
                              </p>
                            ) : (
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Esperando confirmación del cliente...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                          status?.deliveryConfirmed
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-amber-100 dark:bg-amber-900/30'
                        }`}>
                          <Trophy className={`h-5 w-5 ${
                            status?.deliveryConfirmed
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`} />
                          <span className={`font-bold ${
                            status?.deliveryConfirmed
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {status?.deliveryConfirmed ? 'Completado' : 'Ganado'}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant={canRate ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRateClick(project.id, project.name);
                          }}
                          className="gap-1"
                          data-testid={`button-rate-${project.id}`}
                          disabled={!canRate && status?.deliveryConfirmed}
                        >
                          <Star className="h-4 w-4" />
                          {status?.hasRated ? "Calificado" : "Calificar"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Trophy}
            title="No hay proyectos ganados"
            description="Tus proyectos ganados aparecerán aquí"
          />
        )}
      </main>

      <RatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        title={`Califica a ${selectedProjectName ? "este cliente" : ""}`}
        description="Cuéntanos tu experiencia trabajando con este cliente"
        targetName="el cliente"
        onSubmit={handleRatingSubmit}
        isLoading={ratingMutation.isPending}
      />
    </div>
  );
}
