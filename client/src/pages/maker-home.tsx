import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCardSkeleton } from "@/components/LoadingSkeleton";
import { Printer, Package, MessageSquare, DollarSign, Search, Filter } from "lucide-react";
import { MakerProfileDialog } from "@/components/MakerProfileDialog";
import { useLocation } from "wouter";
import type { Project, MakerProfile } from "@shared/schema";

export default function MakerHome() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [printerTypeFilter, setPrinterTypeFilter] = useState<string>("all");
  const [multicolorFilter, setMulticolorFilter] = useState<string>("all");

  const { data: profile } = useQuery<MakerProfile>({
    queryKey: ["/api/maker-profile"],
    enabled: !!user,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<(Project & { bidCount: number })[]>({
    queryKey: ["/api/projects/available"],
    enabled: !!user && !!profile,
  });

  const { data: myBids } = useQuery<{ projectId: string; status: string }[]>({
    queryKey: ["/api/bids/my-bids"],
    enabled: !!user && !!profile,
  });

  const { data: stats } = useQuery<{
    activeBids: number;
    wonProjects: number;
    earnings: number;
  }>({
    queryKey: ["/api/bids/stats"],
    enabled: !!user && !!profile,
  });

  // Redirect if not authenticated
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

  // Show profile setup if maker hasn't completed it
  useEffect(() => {
    if (user && user.userType === "maker" && !profile) {
      setProfileDialogOpen(true);
    }
  }, [user, profile]);

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

  if (!user) {
    return null;
  }

  // Filter projects
  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrinter = printerTypeFilter === "all" || 
      (profile?.printerType === printerTypeFilter);
    
    const matchesMulticolor = multicolorFilter === "all" || 
      (multicolorFilter === "yes" && profile?.hasMulticolor) ||
      (multicolorFilter === "no" && !profile?.hasMulticolor);

    return matchesSearch && matchesPrinter && matchesMulticolor && project.status === "active";
  });

  const activeBidsCount = myBids?.filter(bid => bid.status === "pending").length || 0;
  const canBidMore = activeBidsCount < 2;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">VoxelHub</h1>
                <p className="text-sm text-muted-foreground">Dashboard de Maker</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setProfileDialogOpen(true)}
                data-testid="button-edit-profile"
              >
                Mi Perfil
              </Button>
              <span className="text-sm text-muted-foreground">
                Hola, {user.firstName || user.email}
              </span>
              <Button variant="outline" asChild size="sm">
                <a href="/api/logout" data-testid="button-logout">Cerrar Sesión</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ofertas Activas</p>
                  <p className="text-3xl font-bold" data-testid="stat-active-bids">
                    {stats?.activeBids || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {canBidMore ? `Puedes hacer ${2 - activeBidsCount} más` : "Límite alcanzado"}
                  </p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Proyectos Ganados</p>
                  <p className="text-3xl font-bold" data-testid="stat-won-projects">
                    {stats?.wonProjects || 0}
                  </p>
                </div>
                <div className="bg-secondary/10 p-3 rounded-full">
                  <Package className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ganancias del Mes</p>
                  <p className="text-3xl font-bold" data-testid="stat-earnings">
                    €{stats?.earnings?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Filtrar Proyectos</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar proyectos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-projects"
                />
              </div>
              <Select value={printerTypeFilter} onValueChange={setPrinterTypeFilter}>
                <SelectTrigger data-testid="select-printer-filter">
                  <SelectValue placeholder="Tipo de impresora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las impresoras</SelectItem>
                  <SelectItem value="FDM">FDM/FFF</SelectItem>
                  <SelectItem value="SLA">SLA/DLP</SelectItem>
                  <SelectItem value="SLS">SLS</SelectItem>
                </SelectContent>
              </Select>
              <Select value={multicolorFilter} onValueChange={setMulticolorFilter}>
                <SelectTrigger data-testid="select-multicolor-filter">
                  <SelectValue placeholder="Multicolor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Multicolor</SelectItem>
                  <SelectItem value="no">Un solo color</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Proyectos Disponibles</h2>
            <p className="text-sm text-muted-foreground">
              {filteredProjects?.length || 0} proyectos encontrados
            </p>
          </div>
          {projectsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
            </div>
          ) : filteredProjects && filteredProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setLocation(`/project/${project.id}`)}
                  showBidCount={false}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No hay proyectos disponibles"
              description={searchQuery || printerTypeFilter !== "all" || multicolorFilter !== "all" 
                ? "Intenta ajustar los filtros para ver más proyectos"
                : "No hay proyectos activos en este momento. Vuelve más tarde para ver nuevas oportunidades"}
            />
          )}
        </div>
      </main>

      <MakerProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen}
        profile={profile}
      />
    </div>
  );
}
