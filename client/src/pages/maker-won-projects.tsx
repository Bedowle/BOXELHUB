import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { ArrowLeft, Trophy, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import type { Project } from "@shared/schema";

interface RatingCheckResponse {
  deliveryConfirmed: boolean;
  hasRated: boolean;
}

// Bid type from database
interface Bid {
  id: string;
  projectId: string;
  makerId: string;
  price: string;
  deliveryDays: number;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  deliveryConfirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MakerWonProjects() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bidsWithDelivery, setBidsWithDelivery] = useState<Record<string, { deliveryConfirmed: boolean; projectStatus: string }>>({});

  const { data: allBids } = useQuery<Bid[]>({
    queryKey: ["/api/bids/my-bids"],
    enabled: !!user,
  });

  const { data: myBidProjects, isLoading: projectsLoading } = useQuery<(Project & { bidCount: number })[]>({
    queryKey: ["/api/projects/my-bids"],
    enabled: !!user,
  });

  // Get delivery status for all bids
  useEffect(() => {
    console.log("[useEffect] Checking delivery status:", { allBidsCount: allBids?.length, myBidProjectsCount: myBidProjects?.length });
    if (!allBids || !myBidProjects || allBids.length === 0) {
      console.log("[useEffect] Skipping - no data yet");
      return;
    }

    const getDeliveryStatus = async () => {
      console.log("[getDeliveryStatus] Starting...");
      const statuses: Record<string, { deliveryConfirmed: boolean; projectStatus: string }> = {};

      for (const bid of allBids) {
        if (bid.status === "accepted") {
          try {
            const res = await apiRequest("GET", `/api/projects/${bid.projectId}/check-rating-by-maker`);
            const response = await res.json() as RatingCheckResponse;
            const project = myBidProjects.find(p => p.id === bid.projectId);
            console.log(`[getDeliveryStatus] Full response for ${bid.projectId}:`, response);
            statuses[bid.projectId] = {
              deliveryConfirmed: response.deliveryConfirmed ?? false,
              projectStatus: project?.status || "unknown",
            };
            console.log(`[getDeliveryStatus] Project ${bid.projectId} - confirmed: ${response.deliveryConfirmed}, stored as: ${statuses[bid.projectId].deliveryConfirmed}`);
          } catch (error) {
            console.error("Failed to check delivery status:", error);
          }
        }
      }
      console.log("[getDeliveryStatus] Complete, statuses:", statuses);
      setBidsWithDelivery(statuses);
    };

    getDeliveryStatus();
  }, [allBids, myBidProjects]);

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

  // Filter: Show projects that have accepted bids (regardless of completion status)
  const wonProjects = myBidProjects?.filter(p => {
    // While allBids is loading, show all non-completed projects
    // Once allBids loads, only show projects with accepted bids
    if (!allBids) {
      return p.status !== "completed";
    }
    const hasAcceptedBid = allBids.some(b => b.projectId === p.id && b.status === "accepted");
    return hasAcceptedBid;
  }) || [];

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
          <h1 className="text-3xl font-bold mb-2">Mis Proyectos Ganados</h1>
          <p className="text-muted-foreground">
            {wonProjects.length} proyecto{wonProjects.length !== 1 ? "s" : ""}
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
        ) : wonProjects.length > 0 ? (
          <div className="space-y-4">
            {wonProjects.map((project) => {
              const deliveryStatus = bidsWithDelivery[project.id];
              const isConfirmed = deliveryStatus?.deliveryConfirmed ?? false;

              return (
                <Card 
                  key={project.id}
                  className="hover-elevate cursor-pointer transition-all border-amber-200 dark:border-amber-900 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40"
                  onClick={() => setLocation(`/maker/project/${project.id}`)}
                  data-testid={`card-won-project-${project.id}`}
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{project.name}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-2">
                            {isConfirmed ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  Recepción confirmada
                                </p>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                  Esperando confirmación de entrega
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-amber-100 dark:bg-amber-900/30 px-3 py-2 rounded-lg">
                          <p className="text-sm font-bold text-amber-600 dark:text-amber-400">Ganado</p>
                        </div>
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
            title="No hay proyectos ganados en progreso"
            description="Tus proyectos aparecerán aquí cuando ganes una oferta. Una vez completados, los encontrarás en 'Proyectos Completados'"
          />
        )}
      </main>
    </div>
  );
}
