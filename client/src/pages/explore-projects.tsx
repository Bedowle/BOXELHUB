import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCardSkeleton } from "@/components/LoadingSkeleton";
import { ArrowLeft, Search, TrendingUp, Sliders, HelpCircle } from "lucide-react";
import { useLocation } from "wouter";
import type { Project, MakerProfile } from "@shared/schema";

const MATERIAL_OPTIONS = ["PLA", "PETG", "ABS", "TPU", "Nylon", "Resin", "Flexible", "Madera", "Metal", "Cerámica"];

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
  const [maxDimensionX, setMaxDimensionX] = useState<string>("");
  const [maxDimensionY, setMaxDimensionY] = useState<string>("");
  const [maxDimensionZ, setMaxDimensionZ] = useState<string>("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

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

    // Filter by dimensions - show projects with dimensions BELOW the maximum specified
    // (project dimensions must be smaller than or equal to maker's maximum)
    let matchesDimensions = true;
    if (maxDimensionX || maxDimensionY || maxDimensionZ) {
      const projectSpecs = (project as any).specifications || {};
      const projX = parseInt(projectSpecs.dimensionX) || 0;
      const projY = parseInt(projectSpecs.dimensionY) || 0;
      const projZ = parseInt(projectSpecs.dimensionZ) || 0;
      
      const filterX = parseInt(maxDimensionX) || Infinity;
      const filterY = parseInt(maxDimensionY) || Infinity;
      const filterZ = parseInt(maxDimensionZ) || Infinity;
      
      matchesDimensions = projX <= filterX && projY <= filterY && projZ <= filterZ;
    }

    // Filter by materials
    let matchesMaterial = true;
    if (selectedMaterials.length > 0) {
      matchesMaterial = selectedMaterials.includes(project.material);
    }

    return matchesSearch && matchesPrinter && matchesMulticolor && matchesDimensions && matchesMaterial;
  });

  const activeFiltersCount = [
    printerTypeFilter !== "all" ? 1 : 0,
    multicolorFilter !== "all" ? 1 : 0,
    maxDimensionX ? 1 : 0,
    maxDimensionY ? 1 : 0,
    maxDimensionZ ? 1 : 0,
    selectedMaterials.length > 0 ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="border-b px-4 py-4 sticky top-0 z-50 bg-gradient-to-r from-secondary/10 via-transparent to-primary/10 dark:from-secondary/20 dark:via-slate-900/50 dark:to-primary/20 backdrop-blur-md border-secondary/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="hover-elevate"
          data-testid="button-back-to-maker"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
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
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-4 max-h-96 overflow-y-auto" align="end" data-testid="popover-filters">
                <div className="space-y-4">
                  {/* Printer Type */}
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
                        <SelectItem value="PrusaMK3S">Prusa MK3S</SelectItem>
                        <SelectItem value="Ultimaker">Ultimaker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Color/Multicolor */}
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

                  {/* Dimension X */}
                  <div>
                    <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                      Dimensión X Máxima (mm)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Largo - Mostrar solo proyectos más pequeños que este valor</p>
                        </TooltipContent>
                      </Tooltip>
                    </label>
                    <Input
                      type="number"
                      placeholder="Sin límite"
                      value={maxDimensionX}
                      onChange={(e) => setMaxDimensionX(e.target.value)}
                      min="0"
                      data-testid="input-max-dimension-x"
                    />
                  </div>

                  {/* Dimension Y */}
                  <div>
                    <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                      Dimensión Y Máxima (mm)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Ancho - Mostrar solo proyectos más pequeños que este valor</p>
                        </TooltipContent>
                      </Tooltip>
                    </label>
                    <Input
                      type="number"
                      placeholder="Sin límite"
                      value={maxDimensionY}
                      onChange={(e) => setMaxDimensionY(e.target.value)}
                      min="0"
                      data-testid="input-max-dimension-y"
                    />
                  </div>

                  {/* Dimension Z */}
                  <div>
                    <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                      Dimensión Z Máxima (mm)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Alto - Mostrar solo proyectos más pequeños que este valor</p>
                        </TooltipContent>
                      </Tooltip>
                    </label>
                    <Input
                      type="number"
                      placeholder="Sin límite"
                      value={maxDimensionZ}
                      onChange={(e) => setMaxDimensionZ(e.target.value)}
                      min="0"
                      data-testid="input-max-dimension-z"
                    />
                  </div>

                  {/* Materials */}
                  <div>
                    <label className="text-sm font-semibold mb-3 block">Materiales</label>
                    <div className="space-y-2">
                      {MATERIAL_OPTIONS.map(material => (
                        <div key={material} className="flex items-center gap-2">
                          <Checkbox
                            id={`material-${material}`}
                            checked={selectedMaterials.includes(material)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMaterials([...selectedMaterials, material]);
                              } else {
                                setSelectedMaterials(selectedMaterials.filter(m => m !== material));
                              }
                            }}
                            data-testid={`checkbox-material-${material}`}
                          />
                          <label htmlFor={`material-${material}`} className="text-sm cursor-pointer">
                            {material}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPrinterTypeFilter("all");
                      setMulticolorFilter("all");
                      setMaxDimensionX("");
                      setMaxDimensionY("");
                      setMaxDimensionZ("");
                      setSelectedMaterials([]);
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
                searchQuery || printerTypeFilter !== "all" || multicolorFilter !== "all" || maxDimensionX || maxDimensionY || maxDimensionZ || selectedMaterials.length > 0
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
                      // Save the current page before navigating
                      localStorage.setItem('previousProjectPath', '/maker/explore');
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
