import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCardSkeleton } from "@/components/LoadingSkeleton";
import { UploadProjectDialog } from "@/components/UploadProjectDialog";
import { ArrowLeft, Package, Upload, Bell } from "lucide-react";
import type { Project } from "@shared/schema";

export default function ClientProjectsActive() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: projects, isLoading: projectsLoading } = useQuery<(Project & { bidCount: number })[]>({
    queryKey: ["/api/projects/my-projects"],
    enabled: !!user,
  });

  const { data: unreadCounts } = useQuery<Record<string, number>>({
    queryKey: ["/api/projects/unread-bid-counts"],
    enabled: !!user && !!projects?.length,
    queryFn: async () => {
      if (!projects?.length) return {};
      const counts: Record<string, number> = {};
      for (const project of projects) {
        try {
          const res = await fetch(`/api/projects/${project.id}/unread-bid-count`);
          if (res.ok) {
            const data = await res.json();
            counts[project.id] = data.unreadCount || 0;
          }
        } catch (error) {
          console.error(`Failed to fetch unread count for project ${project.id}:`, error);
        }
      }
      return counts;
    },
  });

  const { data: totalUnreadBids } = useQuery<{ totalUnread: number }>({
    queryKey: ["/api/projects/total-unread-bids"],
    enabled: !!user,
  });

  const totalUnread = useMemo(() => {
    return Object.values(unreadCounts || {}).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

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

  const activeProjects = projects?.filter(p => p.status === "active") || [];
  const inProgressProjects = projects?.filter(p => p.status === "reserved") || [];
  const allProjects = [...activeProjects, ...inProgressProjects];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-4 sticky top-0 z-50 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 dark:from-primary/20 dark:via-slate-900/50 dark:to-secondary/20 backdrop-blur-md border-primary/20">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="hover-elevate"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => setUploadDialogOpen(true)}
            className="flex items-center gap-2"
            data-testid="button-upload-project"
          >
            <Upload className="h-4 w-4" />
            Subir Proyecto
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Proyectos Activos y en Ejecución</h1>
          <p className="text-muted-foreground">
            {allProjects.length} proyecto{allProjects.length !== 1 ? "s" : ""}
          </p>
        </div>

        {projectsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
        ) : allProjects.length > 0 ? (
          <>
            {/* Active Projects Section */}
            {activeProjects.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-primary">Proyectos Activos</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => setLocation(`/project/${project.id}`)}
                      unreadBidCount={unreadCounts?.[project.id] || 0}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Projects Section */}
            {inProgressProjects.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-secondary">Proyectos en Ejecución</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inProgressProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => setLocation(`/project/${project.id}`)}
                      unreadBidCount={unreadCounts?.[project.id] || 0}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={Package}
            title="Sin proyectos activos"
            description="Todos tus proyectos han sido completados"
          />
        )}
      </main>

      <UploadProjectDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}
