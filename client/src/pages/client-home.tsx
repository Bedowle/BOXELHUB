import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCardSkeleton } from "@/components/LoadingSkeleton";
import { Upload, Package, Zap, TrendingUp, Plus, FileUp, ArrowLeft, CheckCircle } from "lucide-react";
import { UploadProjectDialog } from "@/components/UploadProjectDialog";
import { useLocation } from "wouter";
import type { Project } from "@shared/schema";

export default function ClientHome() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: projects, isLoading: projectsLoading } = useQuery<(Project & { bidCount: number })[]>({
    queryKey: ["/api/projects/my-projects"],
    enabled: !!user,
  });

  const { data: stats } = useQuery<{
    activeProjects: number;
    pendingBids: number;
    acceptedOffers: number;
  }>({
    queryKey: ["/api/projects/stats"],
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

  const activeProjects = projects?.filter(p => p.status === "active") || [];
  const inProgressProjects = projects?.filter(p => p.status === "reserved") || [];
  const completedProjects = projects?.filter(p => p.status === "completed") || [];
  const canUploadMore = activeProjects.length < 10;
  const totalBids = projects?.reduce((sum, p) => sum + p.bidCount, 0) || 0;

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
            Bienvenido a tu Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Gestiona tus proyectos STL y recibe ofertas de los mejores makers
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {/* Projects in Progress */}
          <Card 
            className="border-2 border-primary/20 hover-elevate cursor-pointer"
            onClick={() => setLocation("/client/projects-active")}
            data-testid="card-stats-in-progress"
          >
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Proyectos en Progreso</span>
                  <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {activeProjects.length + inProgressProjects.length}
                  </p>
                  <p className="text-xs text-muted-foreground">activos y aceptados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Bids */}
          <Card 
            className="border-2 border-secondary/20 hover-elevate cursor-pointer"
            onClick={() => setLocation("/client/bids")}
            data-testid="card-stats-pending-bids"
          >
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Ofertas Pendientes</span>
                  <div className="bg-secondary/10 dark:bg-secondary/20 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-secondary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{stats?.pendingBids || 0}</p>
                  <p className="text-xs text-muted-foreground">{totalBids} total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Projects */}
          <Card 
            className="border-2 border-green-500/20 hover-elevate cursor-pointer"
            onClick={() => setLocation("/client/projects-completed")}
            data-testid="card-stats-completed-projects"
          >
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Proyectos Terminados</span>
                  <div className="bg-green-500/10 dark:bg-green-500/20 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{completedProjects.length}</p>
                  <p className="text-xs text-muted-foreground">completados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Card - Upload Project */}
        <Card className="mb-12 border-2 border-dashed border-primary/30 hover-elevate bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:via-transparent dark:to-secondary/10">
          <CardContent className="pt-10 pb-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 justify-center md:justify-start">
                  <FileUp className="h-6 w-6 text-primary" />
                  Sube tu próximo proyecto
                </h2>
                <p className="text-muted-foreground max-w-sm">
                  {canUploadMore 
                    ? `Tienes ${10 - activeProjects.length} espacio${10 - activeProjects.length !== 1 ? 's' : ''} disponible${10 - activeProjects.length !== 1 ? 's' : ''}`
                    : "Has alcanzado el límite de 10 proyectos activos"}
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={() => setUploadDialogOpen(true)}
                disabled={!canUploadMore}
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
                data-testid="button-upload-project"
              >
                <Plus className="mr-2 h-5 w-5" />
                Subir Archivo STL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Tus Proyectos</h2>
            <p className="text-muted-foreground mt-1">
              {activeProjects.length} {activeProjects.length === 1 ? "proyecto" : "proyectos"} activo{activeProjects.length !== 1 ? "s" : ""}
            </p>
          </div>

          {projectsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
            </div>
          ) : activeProjects.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Sin proyectos aún"
              description="Sube tu primer archivo STL para recibir ofertas de makers profesionales"
              actionLabel="Subir Proyecto"
              onAction={() => setUploadDialogOpen(true)}
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setLocation(`/project/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <UploadProjectDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
    </div>
  );
}
