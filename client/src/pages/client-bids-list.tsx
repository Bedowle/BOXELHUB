import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { ArrowLeft, Gavel, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Project } from "@shared/schema";

interface ProjectWithBids extends Project {
  bidCount: number;
  bids?: any[];
}

export default function ClientBidsList() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showOldBids, setShowOldBids] = useState(false);

  const { data: projects, isLoading: projectsLoading } = useQuery<ProjectWithBids[]>({
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

  const projectsWithBids = projects?.filter(p => p.bidCount > 0 && p.status === 'active') || [];
  const completedProjectsWithBids = projects?.filter(p => p.bidCount > 0 && p.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-4 sticky top-0 z-50 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 dark:from-primary/20 dark:via-slate-900/50 dark:to-secondary/20 backdrop-blur-md border-primary/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="hover-elevate"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Ofertas Recibidas</h1>
          <p className="text-muted-foreground">
            {projectsWithBids.length} proyecto{projectsWithBids.length !== 1 ? "s" : ""} con ofertas
          </p>
        </div>

        {projectsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6 pb-6 h-24" />
              </Card>
            ))}
          </div>
        ) : projectsWithBids.length > 0 ? (
          <div className="space-y-6">
            {/* Active Offers */}
            <div className="space-y-4">
              {projectsWithBids.map((project) => (
                <Card 
                  key={project.id}
                  className="border-2 border-amber-300/50 bg-gradient-to-br from-amber-100 to-amber-50/50 dark:from-amber-900/40 dark:to-amber-950/20 hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/project/${project.id}`)}
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{project.name}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Publicado {formatDistanceToNow(new Date(project.createdAt), { locale: es, addSuffix: true })}
                        </p>
                      </div>
                      <div className="bg-amber-100/60 dark:bg-amber-950/40 px-3 py-2 rounded-lg">
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <Gavel className="h-3 w-3" />
                          {project.bidCount} ofertas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Old Offers Toggle */}
            {completedProjectsWithBids.length > 0 && (
              <div className="mt-8">
                <Button
                  onClick={() => setShowOldBids(!showOldBids)}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  data-testid="button-toggle-old-offers"
                >
                  {showOldBids ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Ocultar ofertas antiguas ({completedProjectsWithBids.length})
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Mostrar ofertas antiguas ({completedProjectsWithBids.length})
                    </>
                  )}
                </Button>

                {showOldBids && (
                  <div className="space-y-4 mt-4">
                    {completedProjectsWithBids.map((project) => (
                      <Card 
                        key={project.id}
                        className="border-2 border-amber-200/50 bg-gradient-to-br from-amber-50 to-amber-25 dark:from-amber-900/30 dark:to-amber-950/15 hover-elevate cursor-pointer opacity-60"
                        onClick={() => setLocation(`/project/${project.id}`)}
                      >
                        <CardContent className="pt-6 pb-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg">{project.name}</h3>
                              <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Completado {formatDistanceToNow(new Date(project.createdAt), { locale: es, addSuffix: true })}
                              </p>
                            </div>
                            <div className="bg-amber-100/60 dark:bg-amber-950/40 px-3 py-2 rounded-lg">
                              <p className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                <Gavel className="h-3 w-3" />
                                {project.bidCount} ofertas
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={Gavel}
            title="No hay ofertas"
            description="Aún no has recibido ofertas en tus proyectos"
          />
        )}
      </main>
    </div>
  );
}
