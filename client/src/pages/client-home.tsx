import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage.tsx";
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
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();

  // Save the current home page URL when this component mounts
  useEffect(() => {
    localStorage.setItem('previousProjectPath', '/');
  }, []);

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
        title: t('common.unauthorized'),
        description: t('common.loading'),
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast, t]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
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
            {t('common.back')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            {language === 'es' ? 'Bienvenido a tu Dashboard' : 'Welcome to your Dashboard'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {language === 'es' ? 'Gestiona tus proyectos STL y recibe ofertas de los mejores makers' : 'Manage your STL projects and receive offers from the best makers'}
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
                  <span className="text-sm font-semibold text-muted-foreground">{language === 'es' ? 'Proyectos en Progreso' : 'Projects in Progress'}</span>
                  <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {activeProjects.length + inProgressProjects.length}
                  </p>
                  <p className="text-xs text-muted-foreground">{language === 'es' ? 'activos y aceptados' : 'active and accepted'}</p>
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
                  <span className="text-sm font-semibold text-muted-foreground">{language === 'es' ? 'Ofertas Pendientes' : 'Pending Bids'}</span>
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
                  <span className="text-sm font-semibold text-muted-foreground">{language === 'es' ? 'Proyectos Terminados' : 'Completed Projects'}</span>
                  <div className="bg-green-500/10 dark:bg-green-500/20 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{completedProjects.length}</p>
                  <p className="text-xs text-muted-foreground">{language === 'es' ? 'completados' : 'completed'}</p>
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
                  {language === 'es' ? 'Sube tu próximo proyecto' : 'Upload your next project'}
                </h2>
                <p className="text-muted-foreground max-w-sm">
                  {canUploadMore 
                    ? (language === 'es' ? `Tienes ${10 - activeProjects.length} espacio${10 - activeProjects.length !== 1 ? 's' : ''} disponible${10 - activeProjects.length !== 1 ? 's' : ''}` : `You have ${10 - activeProjects.length} space${10 - activeProjects.length !== 1 ? 's' : ''} available`)
                    : (language === 'es' ? "Has alcanzado el límite de 10 proyectos activos" : "You have reached the limit of 10 active projects")}
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
                {language === 'es' ? 'Subir Archivo STL' : 'Upload STL File'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold">{language === 'es' ? 'Tus Proyectos' : 'Your Projects'}</h2>
            <p className="text-muted-foreground mt-1">
              {language === 'es' 
                ? `${activeProjects.length} ${activeProjects.length === 1 ? "proyecto" : "proyectos"} activo${activeProjects.length !== 1 ? "s" : ""}` 
                : `${activeProjects.length} active ${activeProjects.length === 1 ? "project" : "projects"}`}
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
              title={language === 'es' ? 'Sin proyectos aún' : 'No projects yet'}
              description={language === 'es' ? 'Sube tu primer archivo STL para recibir ofertas de makers profesionales' : 'Upload your first STL file to receive offers from professional makers'}
              actionLabel={language === 'es' ? 'Subir Proyecto' : 'Upload Project'}
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
