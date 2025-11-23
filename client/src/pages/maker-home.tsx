import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCardSkeleton } from "@/components/LoadingSkeleton";
import { Printer, Package, CheckCircle, Zap, Search, Filter, TrendingUp, MessageCircle, ArrowLeft } from "lucide-react";
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
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [hasShownProfileDialog, setHasShownProfileDialog] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [printerTypeFilter, setPrinterTypeFilter] = useState<string>("all");
  const [multicolorFilter, setMulticolorFilter] = useState<string>("all");
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

  const { data: myBids } = useQuery<{ projectId: string; status: string }[]>({
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
    if (user && user.userType === "maker" && !profileLoading && !profile && !hasShownProfileDialog) {
      setProfileDialogOpen(true);
      setHasShownProfileDialog(true);
    }
  }, [user, profile, profileLoading, hasShownProfileDialog]);

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
  
  const filteredProjects = allProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrinter = printerTypeFilter === "all" || 
      (profile?.printerType === printerTypeFilter);
    
    const matchesMulticolor = multicolorFilter === "all" || 
      (multicolorFilter === "yes" && profile?.hasMulticolor) ||
      (multicolorFilter === "no" && !profile?.hasMulticolor);

    return matchesSearch && matchesPrinter && matchesMulticolor;
  });

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
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
            data-testid="button-back-to-home"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Explora Proyectos
          </h1>
          <p className="text-lg text-muted-foreground">
            Encuentra proyectos que coincidan con tus capacidades y haz ofertas competitivas
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {/* Active Bids */}
          <Card 
            className="border-2 border-primary/20 hover-elevate cursor-pointer"
            onClick={() => setLocation("/maker/bids")}
            data-testid="card-stats-active-bids"
          >
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Ofertas Activas</span>
                  <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{stats?.activeBids || 0}</p>
                  <p className="text-xs text-muted-foreground">de 2 máximo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Won Projects */}
          <Card 
            className="border-2 border-secondary/20 hover-elevate cursor-pointer"
            onClick={() => setLocation("/maker/won-projects")}
            data-testid="card-stats-won-projects"
          >
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Proyectos Ganados</span>
                  <div className="bg-secondary/10 dark:bg-secondary/20 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-secondary" />
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
            className="border-2 border-accent/20 hover-elevate cursor-pointer"
            onClick={() => setLocation("/maker/completed-projects")}
            data-testid="card-stats-completed-projects"
          >
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Proyectos Completados</span>
                  <div className="bg-accent/10 dark:bg-accent/20 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-accent" />
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

        {/* Profile Section */}
        {profile && (
          <Card className="mb-10 border-2 border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:via-transparent dark:to-secondary/10">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Printer className="h-5 w-5 text-primary" />
                    {profile.printerType}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Materiales: {profile.materials.join(", ")} {profile.hasMulticolor && "• Multicolor"}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setProfileDialogOpen(true)}
                  data-testid="button-edit-profile"
                >
                  Editar Perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Conversations Section */}
        {conversations && conversations.length > 0 && (
          <div className="mb-10">
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-primary" />
                Mis Conversaciones
              </h2>
              <p className="text-muted-foreground mt-2">
                {conversations.length} conversación{conversations.length !== 1 ? "es" : ""} activa{conversations.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {conversations.map((conv) => (
                <Card 
                  key={conv.userId}
                  className="hover-elevate cursor-pointer transition-all"
                  onClick={() => {
                    if (conv.user) {
                      setSelectedChatUser(conv.user);
                      setChatDialogOpen(true);
                    }
                  }}
                  data-testid={`card-conversation-${conv.userId}`}
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          {conv.user?.firstName || "Usuario"}
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (conv.user) {
                              setSelectedChatUser(conv.user);
                              setChatDialogOpen(true);
                            }
                          }}
                          data-testid={`button-open-chat-${conv.userId}`}
                        >
                          Abrir Chat
                        </Button>
                      </div>
                      {conv.lastMessage && (
                        <div className="text-sm text-muted-foreground">
                          <p className="line-clamp-2 mb-1">{conv.lastMessage.content}</p>
                          <p className="text-xs">
                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { locale: es, addSuffix: true })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Busca proyectos por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
              data-testid="input-search-projects"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Select value={printerTypeFilter} onValueChange={setPrinterTypeFilter}>
                <SelectTrigger data-testid="select-printer-type">
                  <SelectValue placeholder="Tipo de Impresora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las impresoras</SelectItem>
                  <SelectItem value="Ender3">Ender 3</SelectItem>
                  <SelectItem value="BambooLab">Bambu Lab</SelectItem>
                  <SelectItem value="FDM">FDM</SelectItem>
                  <SelectItem value="SLA">SLA</SelectItem>
                  <SelectItem value="SLS">SLS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Select value={multicolorFilter} onValueChange={setMulticolorFilter}>
                <SelectTrigger data-testid="select-multicolor">
                  <SelectValue placeholder="Multicolor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquiera</SelectItem>
                  <SelectItem value="yes">Con multicolor</SelectItem>
                  <SelectItem value="no">Sin multicolor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Proyectos Disponibles
            </h2>
            <p className="text-muted-foreground mt-2">
              {filteredProjects?.length || 0} proyecto{(filteredProjects?.length || 0) !== 1 ? "s" : ""} coincide{(filteredProjects?.length || 0) !== 1 ? "n" : ""}
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
              title="Sin resultados"
              description={
                searchQuery || printerTypeFilter !== "all" || multicolorFilter !== "all"
                  ? "Intenta ajustar tus filtros de búsqueda"
                  : "No hay proyectos disponibles en este momento"
              }
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects?.map((project) => {
                const hasMyBid = myBidProjects?.some(p => p.id === project.id);
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => {
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
          )}
        </div>
      </main>

      <MakerProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} profile={profile || null} />
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
