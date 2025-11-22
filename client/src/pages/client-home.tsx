import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCardSkeleton } from "@/components/LoadingSkeleton";
import { Upload, Package, MessageSquare, Clock, Plus } from "lucide-react";
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

  const activeProjects = projects?.filter(p => p.status === "active") || [];
  const canUploadMore = activeProjects.length < 10;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">VoxelHub</h1>
                <p className="text-sm text-muted-foreground">Dashboard de Cliente</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
                  <p className="text-sm text-muted-foreground mb-1">Proyectos Activos</p>
                  <p className="text-3xl font-bold" data-testid="stat-active-projects">
                    {stats?.activeProjects || 0}
                  </p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ofertas Pendientes</p>
                  <p className="text-3xl font-bold" data-testid="stat-pending-bids">
                    {stats?.pendingBids || 0}
                  </p>
                </div>
                <div className="bg-secondary/10 p-3 rounded-full">
                  <MessageSquare className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ofertas Aceptadas</p>
                  <p className="text-3xl font-bold" data-testid="stat-accepted-offers">
                    {stats?.acceptedOffers || 0}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Project CTA */}
        <Card className="mb-8 border-2 border-dashed hover-elevate">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-semibold mb-2">Sube un nuevo proyecto</h3>
                <p className="text-muted-foreground">
                  {canUploadMore 
                    ? `Tienes ${10 - activeProjects.length} espacios disponibles de 10 proyectos activos`
                    : "Has alcanzado el límite de 10 proyectos activos"}
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={() => setUploadDialogOpen(true)}
                disabled={!canUploadMore}
                data-testid="button-upload-project"
              >
                <Plus className="mr-2 h-5 w-5" />
                Subir Proyecto STL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Mis Proyectos</h2>
          {projectsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setLocation(`/project/${project.id}`)}
                  showBidCount
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Upload}
              title="No tienes proyectos aún"
              description="Sube tu primer archivo STL y comienza a recibir ofertas de makers profesionales"
              actionLabel="Subir Proyecto"
              onAction={() => setUploadDialogOpen(true)}
            />
          )}
        </div>
      </main>

      <UploadProjectDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}
