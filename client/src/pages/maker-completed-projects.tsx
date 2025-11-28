import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { RatingDialog } from "@/components/RatingDialog";
import { ViewRatingDialog } from "@/components/ViewRatingDialog";
import { ArrowLeft, CheckCircle, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import type { Project, Review } from "@shared/schema";

interface RatingCheckResponse {
  deliveryConfirmed: boolean;
  hasRated: boolean;
}

interface RatingStatus {
  projectId: string;
  hasRated: boolean;
}

export default function MakerCompletedProjects() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [viewRatingDialogOpen, setViewRatingDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [ratingStatuses, setRatingStatuses] = useState<Record<string, boolean>>({});
  const [deliveryConfirmedProjectIds, setDeliveryConfirmedProjectIds] = useState<Set<string>>(new Set());

  const { data: myBidProjects, isLoading: projectsLoading } = useQuery<(Project & { bidCount: number })[]>({
    queryKey: ["/api/projects/my-bids"],
    enabled: !!user,
  });

  const { data: myBids } = useQuery<{ projectId: string; status: string }[]>({
    queryKey: ["/api/bids/my-bids"],
    enabled: !!user,
  });

  // Check rating status for all projects with accepted bids
  useEffect(() => {
    if (!myBidProjects || !myBids) return;

    const projectsWithAcceptedBids = myBidProjects.filter(p => {
      const bid = myBids.find(b => b.projectId === p.id);
      return bid?.status === "accepted";
    });

    const checkRatingStatus = async () => {
      const statuses: Record<string, boolean> = {};
      const confirmedIds = new Set<string>();

      for (const project of projectsWithAcceptedBids) {
        try {
          const res = await apiRequest("GET", `/api/projects/${project.id}/check-rating-by-maker`);
          const response = await res.json() as RatingCheckResponse;
          statuses[project.id] = response.hasRated;
          // Mark projects with confirmed delivery
          if (response.deliveryConfirmed) {
            confirmedIds.add(project.id);
          }
        } catch (error) {
          console.error("Failed to check rating status:", error);
        }
      }
      setRatingStatuses(statuses);
      setDeliveryConfirmedProjectIds(confirmedIds);
    };

    checkRatingStatus();
  }, [myBidProjects, myBids]);

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
      if (selectedProjectId) {
        setRatingStatuses(prev => ({ ...prev, [selectedProjectId]: true }));
      }
      setSelectedProjectId(null);
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

  const completedProjects = myBidProjects?.filter(p => {
    return deliveryConfirmedProjectIds.has(p.id);
  }) || [];

  const handleRateClick = (projectId: string, projectName: string) => {
    setSelectedProjectId(projectId);
    setSelectedProjectName(projectName);
    setRatingDialogOpen(true);
  };

  const handleViewRatingClick = async (projectId: string) => {
    try {
      const res = await apiRequest("GET", `/api/projects/${projectId}/review-from-client`);
      const review = await res.json() as Review;
      setSelectedReview(review);
      setViewRatingDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la calificación",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-4 sticky top-0 z-50 bg-gradient-to-r from-secondary/10 via-transparent to-primary/10 dark:from-secondary/20 dark:via-slate-900/50 dark:to-primary/20 backdrop-blur-md border-secondary/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="hover-elevate"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-bold">Proyectos Completados</h1>
          </div>
          <p className="text-muted-foreground">
            {completedProjects.length} proyecto{completedProjects.length !== 1 ? "s" : ""} completado{completedProjects.length !== 1 ? "s" : ""}
          </p>
        </div>

        {projectsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6 pb-6 h-24" />
              </Card>
            ))}
          </div>
        ) : completedProjects.length > 0 ? (
          <div className="space-y-4">
            {completedProjects.map((project) => {
              const hasRated = ratingStatuses[project.id];

              return (
                <Card 
                  key={project.id}
                  className="border-green-200 dark:border-green-900 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40"
                  data-testid={`card-completed-project-${project.id}`}
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div 
                        className="flex-1 cursor-pointer hover-elevate"
                        onClick={() => setLocation(`/maker/project/${project.id}`)}
                      >
                        <h3 className="font-bold text-lg">{project.name}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Completado {formatDistanceToNow(new Date(project.updatedAt), { locale: es, addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">Entregado</p>
                        </div>
                        {hasRated ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewRatingClick(project.id);
                            }}
                            className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                            data-testid={`button-view-rating-${project.id}`}
                          >
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              Calificado
                            </p>
                          </button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRateClick(project.id, project.name)}
                            className="flex items-center gap-2"
                            data-testid={`button-rate-${project.id}`}
                          >
                            <Star className="h-4 w-4" />
                            Calificar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={CheckCircle}
            title="Sin proyectos completados aún"
            description="Tus proyectos completados aparecerán aquí una vez que se confirme la entrega"
          />
        )}
      </main>

      {selectedProjectId && (
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          title="Calificar Cliente"
          description="¿Cómo fue tu experiencia trabajando en este proyecto?"
          targetName={selectedProjectName}
          onSubmit={(rating, comment) => {
            ratingMutation.mutate({
              projectId: selectedProjectId,
              rating,
              comment,
            });
          }}
          isLoading={ratingMutation.isPending}
        />
      )}

      {selectedReview && (
        <ViewRatingDialog
          open={viewRatingDialogOpen}
          onOpenChange={setViewRatingDialogOpen}
          rating={parseFloat(String(selectedReview.rating))}
          comment={selectedReview.comment || undefined}
          fromUser={(selectedReview as any).fromUser || undefined}
        />
      )}
    </div>
  );
}
