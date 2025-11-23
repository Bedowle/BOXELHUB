import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage.tsx";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCardSkeleton } from "@/components/LoadingSkeleton";
import { Printer, Package, CheckCircle, Zap, Search, TrendingUp, MessageCircle, ArrowLeft } from "lucide-react";
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
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();

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
        title: "Unauthorized",
        description: "Signing in...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast, t]);

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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const projectsLoading = availableLoading || myBidsLoading;
  const allProjects = [...(availableProjects || []), ...(myBidProjects?.filter(p => p.status !== "active") || [])];
  
  const deliveredProjectIds = new Set(
    myBids
      ?.filter(bid => bid.deliveryConfirmedAt)
      .map(bid => bid.projectId) || []
  );
  
  const availableFilteredProjects = allProjects.filter(project => {
    if (project.status === "completed" || deliveredProjectIds.has(project.id)) {
      return false;
    }
    return true;
  });

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
        title: "Rating sent",
        description: "Your rating has been recorded.",
      });
      setRatingDialogOpen(false);
      setDeliveryToRate(null);
      queryClient.invalidateQueries({ queryKey: ["/api/bids/my-bids"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Could not send rating",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          {profile && (
            <Card 
              className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:via-transparent dark:to-secondary/10 hover-elevate cursor-pointer"
              onClick={() => setLocation("/maker/profile")}
              data-testid="card-profile-header"
            >
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Printer className="h-5 w-5 text-primary" />
                      {profile.printerType}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Materials: {profile.materials.join(", ")} {profile.hasMulticolor && "• Multicolor"}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation("/maker/profile");
                    }}
                    data-testid="button-view-profile"
                  >
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Your Maker Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your bids, ongoing projects and completed deliveries
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <Card 
            className="border-2 border-primary/20 hover-elevate cursor-pointer"
            onClick={() => setLocation("/maker/bids")}
            data-testid="card-stats-active-bids"
          >
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Active Bids
                  </span>
                  <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{stats?.activeBids || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    in progress
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-2 border-secondary/20 hover-elevate cursor-pointer"
            onClick={() => setLocation("/maker/won-projects")}
            data-testid="card-stats-won-projects"
          >
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Won Projects
                  </span>
                  <div className="bg-secondary/10 dark:bg-secondary/20 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-secondary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{stats?.wonProjects || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    completed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-2 border-accent/20 hover-elevate cursor-pointer"
            onClick={() => setLocation("/maker/completed-projects")}
            data-testid="card-stats-completed-projects"
          >
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Completed Projects
                  </span>
                  <div className="bg-accent/10 dark:bg-accent/20 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-accent" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{stats?.completedProjects || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    delivered
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Recommended Projects
            </h2>
            <p className="text-muted-foreground mt-2">
              Projects selected for you
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
              title="No projects available"
              description="No projects available at this time"
            />
          ) : (
            <div className="relative">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-0">
                {filteredProjects?.map((project, index) => {
                  const hasMyBid = myBidProjects?.some(p => p.id === project.id);
                  const isHidden = index >= 3;
                  return (
                    <div
                      key={project.id}
                      className={isHidden ? "opacity-40 pointer-events-none" : ""}
                    >
                      <ProjectCard
                        project={project}
                        onClick={() => {
                          localStorage.setItem('previousProjectPath', '/maker');
                          if (hasMyBid) {
                            setLocation(`/maker/project/${project.id}`);
                          } else {
                            setLocation(`/project/${project.id}`);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              {filteredProjects && filteredProjects.length > 3 && (
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background pointer-events-none" />
              )}
            </div>
          )}

          <div className="relative -mt-48 pt-0">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => setLocation("/maker/explore")}
                className="px-8"
                data-testid="button-explore-more-projects"
              >
                Explore More Projects
              </Button>
            </div>
          </div>
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
