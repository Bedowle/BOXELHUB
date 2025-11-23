import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCardSkeleton } from "@/components/LoadingSkeleton";
import { ArrowLeft, Search, TrendingUp, Sliders } from "lucide-react";
import { useLocation } from "wouter";
import type { Project, MakerProfile } from "@shared/schema";

export default function ExploreProjects() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Save the current explore page URL when this component mounts
  useEffect(() => {
    localStorage.setItem('previousProjectPath', '/maker/explore');
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [printerTypeFilter, setPrinterTypeFilter] = useState<string>("all");
  const [multicolorFilter, setMulticolorFilter] = useState<string>("all");
  const [minDimension, setMinDimension] = useState<number>(0);

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

    // Filter by dimensions - check if maker's max dimensions are >= minimum dimension
    let matchesDimensions = true;
    if (minDimension > 0 && profile) {
      const makerMaxX = profile.maxPrintDimensionX || 0;
      const makerMaxY = profile.maxPrintDimensionY || 0;
      const makerMaxZ = profile.maxPrintDimensionZ || 0;
      const minMax = Math.min(makerMaxX, makerMaxY, makerMaxZ);
      matchesDimensions = minMax >= minDimension;
    }

    return matchesSearch && matchesPrinter && matchesMulticolor && matchesDimensions;
  });

  const hasActiveFilters = printerTypeFilter !== "all" || multicolorFilter !== "all" || minDimension > 0;

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
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Busca proyectos por nombre o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
                data-testid="input-search-projects"
              />
            </div>

            {/* Filters Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex items-center gap-2 whitespace-nowrap"
                  data-testid="button-open-filters"
                >
                  <Sliders className="h-4 w-4" />
                  Filtros
                  {hasActiveFilters && (
                    <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {[printerTypeFilter !== "all", multicolorFilter !== "all", minDimension > 0].filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end" data-testid="popover-filters">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Tipo de Impresora</label>
                    <Select value={printerTypeFilter} onValueChange={setPrinterTypeFilter}>
                      <SelectTrigger data-testid="select-printer-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las impresoras</SelectItem>
                        <SelectItem value="Ender3">Ender 3</SelectItem>
                        <SelectItem value="BambooLab">Bambu Lab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Color</label>
                    <Select value={multicolorFilter} onValueChange={setMulticolorFilter}>
                      <SelectTrigger data-testid="select-multicolor">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquiera</SelectItem>
                        <SelectItem value="yes">Multicolor</SelectItem>
                        <SelectItem value="no">Monocolor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-3 block">Dimensión Mínima (mm)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="300"
                        step="10"
                        value={minDimension}
                        onChange={(e) => setMinDimension(Number(e.target.value))}
                        className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                        data-testid="slider-min-dimension"
                      />
                      <span className="text-sm font-semibold bg-muted px-3 py-1 rounded-md w-16 text-center">
                        {minDimension}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Solo mostrar proyectos donde tu impresora pueda imprimir al menos {minDimension}mm en todos los lados
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPrinterTypeFilter("all");
                      setMulticolorFilter("all");
                      setMinDimension(0);
                    }}
                    className="w-full"
                    data-testid="button-reset-filters"
                  >
                    Limpiar Filtros
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
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
                searchQuery || printerTypeFilter !== "all" || multicolorFilter !== "all" || minDimension > 0
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
