import { useState } from "react";
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
import { ArrowLeft, Search, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import type { Project, MakerProfile } from "@shared/schema";

export default function ExploreProjects() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [printerTypeFilter, setPrinterTypeFilter] = useState<string>("all");
  const [multicolorFilter, setMulticolorFilter] = useState<string>("all");

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
  
  const filteredProjects = allProjects.filter(project => {
    // Exclude completed/delivered projects
    if (project.status === "completed" || deliveredProjectIds.has(project.id)) {
      return false;
    }

    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrinter = printerTypeFilter === "all" || 
      (profile?.printerType === printerTypeFilter);
    
    const matchesMulticolor = multicolorFilter === "all" || 
      (multicolorFilter === "yes" && profile?.hasMulticolor) ||
      (multicolorFilter === "no" && !profile?.hasMulticolor);

    return matchesSearch && matchesPrinter && matchesMulticolor;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/maker")}
            className="flex items-center gap-2"
            data-testid="button-back-to-maker"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 flex items-center gap-3">
            <TrendingUp className="h-10 w-10 text-primary" />
            Explora Proyectos
          </h1>
          <p className="text-lg text-muted-foreground">
            Descubre proyectos disponibles y coloca tus ofertas
          </p>
        </div>

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
                  <SelectItem value="yes">Multicolor</SelectItem>
                  <SelectItem value="no">Monocolor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Search className="h-8 w-8 text-primary" />
              Resultados
            </h2>
            <p className="text-muted-foreground mt-2">
              {filteredProjects?.length || 0} proyecto{(filteredProjects?.length || 0) !== 1 ? "s" : ""} disponible{(filteredProjects?.length || 0) !== 1 ? "s" : ""}
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
    </div>
  );
}
