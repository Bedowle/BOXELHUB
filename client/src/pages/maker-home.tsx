import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCardSkeleton } from "@/components/LoadingSkeleton";
import { Printer, Package, CheckCircle, Gavel, Search, TrendingUp, MessageCircle, ArrowLeft, Sparkles } from "lucide-react";
import { MakerProfileDialog } from "@/components/MakerProfileDialog";
import { ChatDialog } from "@/components/ChatDialog";
import { MakerRatingDialog } from "@/components/MakerRatingDialog";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Project, MakerProfile, User } from "@shared/schema";

export default function MakerHome() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Save the current home page URL when this component mounts
  useEffect(() => {
    localStorage.setItem('previousProjectPath', '/maker');
  }, []);

  const [hasShownProfileDialog, setHasShownProfileDialog] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [deliveryToRate, setDeliveryToRate] = useState<{
    bidId: string;
    clientName: string;
    projectName: string;
  } | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery<MakerProfile>({
    queryKey: ["/api/maker-profile"],
    enabled: !!user,
  });

  const { data: availableProjects, isLoading: availableLoading } = useQuery<(Project & { bidCount: number })[]>({
    queryKey: ["/api/projects/available"],
    enabled: !!user && !!profile,
  });

  const { data: myBidProjects, isLoading: myBidsLoading } = useQuery<(Project & { bidCount: number })[]>({
    queryKey: ["/api/projects/my-bids"],
    enabled: !!user && !!profile,
  });

  const { data: myBids } = useQuery<{ projectId: string; status: string; deliveryConfirmedAt?: string | null }[]>({
    queryKey: ["/api/bids/my-bids"],
    enabled: !!user && !!profile,
  });

  const { data: stats } = useQuery<{
    activeBids: number;
    wonProjects: number;
    completedProjects: number;
  }>({
    queryKey: ["/api/bids/stats"],
    enabled: !!user && !!profile,
  });

  const { data: conversations } = useQuery<Array<{ userId: string; user?: User; lastMessage?: any }>>({
    queryKey: ["/api/my-conversations"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "No autorizado",
        description: "Iniciando sesión...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast]);


  useEffect(() => {
    const handleDeliveryConfirmed = (event: Event) => {
      const customEvent = event as CustomEvent;
      setDeliveryToRate({
        bidId: customEvent.detail.bidId,
        clientName: customEvent.detail.clientName,
        projectName: customEvent.detail.projectName,
      });
      setRatingDialogOpen(true);
    };

    window.addEventListener("delivery_confirmed", handleDeliveryConfirmed);
    return () => window.removeEventListener("delivery_confirmed", handleDeliveryConfirmed);
  }, []);

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

  if (!user) return null;

  const projectsLoading = availableLoading || myBidsLoading;
  const allProjects = [...(availableProjects || []), ...(myBidProjects?.filter(p => p.status !== "active") || [])];
  
  // Get project IDs that have been delivered
  const deliveredProjectIds = new Set(
    myBids
      ?.filter(bid => bid.deliveryConfirmedAt)
      .map(bid => bid.projectId) || []
  );
  
  // Filter out completed/delivered projects and get random ones
  const availableFilteredProjects = allProjects.filter(project => {
    if (project.status === "completed" || deliveredProjectIds.has(project.id)) {
      return false;
    }
    return true;
  });

  // Get 3 random projects for recommendations
  const getRandomProjects = (projects: typeof allProjects, count: number) => {
    const shuffled = [...projects].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const filteredProjects = getRandomProjects(availableFilteredProjects, 6);

  const activeBidsCount = myBids?.filter(bid => bid.status === "pending").length || 0;
  const canBidMore = activeBidsCount < 2;
  const queryClient = useQueryClient();

  const rateClientMutation = useMutation({
    mutationFn: async ({ bidId, rating, comment }: { bidId: string; rating: number; comment?: string }) => {
      await apiRequest("PUT", `/api/bids/${bidId}/rate-client`, { rating, comment });
    },
    onSuccess: () => {
      toast({
        title: "Calificación enviada",
        description: "Tu calificación ha sido registrada.",
      });
      setRatingDialogOpen(false);
      setDeliveryToRate(null);
      queryClient.invalidateQueries({ queryKey: ["/api/bids/my-bids"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la calificación",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-50/50 dark:via-slate-900/50 to-background">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12 bg-gradient-to-r from-secondary/10 to-primary/10 dark:from-secondary/20 dark:to-primary/20 rounded-2xl p-8 border border-secondary/20 dark:border-secondary/30">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent">
            Tu Panel de Maker
          </h1>
          <p className="text-lg text-muted-foreground">
            Gestiona tus ofertas, proyectos en progreso y entregas completadas
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {/* Active Bids */}
          <Card 
            className="border-2 border-primary/40 hover-elevate cursor-pointer bg-gradient-to-br from-primary/20 to-transparent dark:from-primary/20 dark:to-transparent"
            onClick={() => setLocation("/maker/bids")}
            data-testid="card-stats-active-bids"
          >
            <CardContent className="pt-4 pb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Ofertas Activas</span>
                  <div className="bg-primary/20 dark:bg-primary/30 p-2 rounded-lg">
                    <Gavel className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{stats?.activeBids || 0}</p>
                  <p className="text-xs text-muted-foreground">en progreso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Won Projects */}
          <Card 
            className="border-2 border-amber-500/40 hover-elevate cursor-pointer bg-gradient-to-br from-amber-100/20 to-transparent dark:from-amber-900/20 dark:to-transparent"
            onClick={() => setLocation("/maker/won-projects")}
            data-testid="card-stats-won-projects"
          >
            <CardContent className="pt-4 pb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Proyectos Ganados</span>
                  <div className="bg-amber-500/20 dark:bg-amber-600/30 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{stats?.wonProjects || 0}</p>
                  <p className="text-xs text-muted-foreground">completados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Projects */}
          <Card 
            className="border-2 border-green-500/40 hover-elevate cursor-pointer bg-gradient-to-br from-green-100/20 to-transparent dark:from-green-900/20 dark:to-transparent"
            onClick={() => setLocation("/maker/completed-projects")}
            data-testid="card-stats-completed-projects"
          >
            <CardContent className="pt-4 pb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Proyectos Completados</span>
                  <div className="bg-green-500/20 dark:bg-green-600/30 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{stats?.completedProjects || 0}</p>
                  <p className="text-xs text-muted-foreground">entregados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Projects Section */}
        <div className="mb-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Proyectos Recomendados
            </h2>
            <p className="text-muted-foreground mt-2">
              Proyectos seleccionados para ti
            </p>
          </div>

          {projectsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
            </div>
          ) : (filteredProjects?.length || 0) === 0 ? (
            <EmptyState
              icon={Search}
              title="Sin proyectos disponibles"
              description="No hay proyectos disponibles en este momento"
            />
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredProjects?.slice(0, 3).map((project) => {
                  const hasMyBid = myBidProjects?.some(p => p.id === project.id);
                  return (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => {
                        // Save the current page before navigating
                        localStorage.setItem('previousProjectPath', '/maker');
                        if (hasMyBid) {
                          setLocation(`/maker/project/${project.id}`);
                        } else {
                          setLocation(`/project/${project.id}`);
                        }
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={() => setLocation("/maker/explore")}
                  className="px-8"
                  data-testid="button-explore-more-projects"
                >
                  Explora Más Proyectos
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      {selectedChatUser && (
        <ChatDialog
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
          otherUser={selectedChatUser}
          currentUserId={user?.id || ""}
        />
      )}
      {deliveryToRate && (
        <MakerRatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          clientName={deliveryToRate.clientName}
          projectName={deliveryToRate.projectName}
          onSubmit={(rating, comment) => {
            rateClientMutation.mutate({ bidId: deliveryToRate.bidId, rating, comment });
          }}
          isLoading={rateClientMutation.isPending}
        />
      )}
    </div>
  );
}
