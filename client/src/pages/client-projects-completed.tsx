import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCardSkeleton } from "@/components/LoadingSkeleton";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import type { Project } from "@shared/schema";

export default function ClientProjectsCompleted() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: projects, isLoading: projectsLoading } = useQuery<(Project & { bidCount: number })[]>({
    queryKey: ["/api/projects/my-projects"],
    enabled: !!user,
  });

  if (!authLoading && !user) {
    toast({
      title: "No autorizado",
      description: "Iniciando sesión...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

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

  const completedProjects = projects?.filter(p => p.status === "completed") || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-bold">Proyectos Terminados</h1>
          </div>
          <p className="text-muted-foreground">
            {completedProjects.length} proyecto{completedProjects.length !== 1 ? "s" : ""} completado{completedProjects.length !== 1 ? "s" : ""}
          </p>
        </div>

        {projectsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
        ) : completedProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setLocation(`/project/${project.id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CheckCircle}
            title="Sin proyectos completados aún"
            description="Tus proyectos aparecerán aquí una vez que se completen las entregas"
          />
        )}
      </main>
    </div>
  );
}
