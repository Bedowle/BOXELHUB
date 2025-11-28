import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { ArrowLeft, Zap } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-100/40 dark:via-blue-950/40 to-background">
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
        <div className="mb-8 bg-gradient-to-r from-blue-600/15 via-primary/15 to-secondary/15 dark:from-blue-500/25 dark:via-primary/25 dark:to-secondary/25 rounded-2xl p-8 border-2 border-primary/50 dark:border-primary/60">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-primary to-secondary bg-clip-text text-transparent dark:from-blue-300 dark:via-primary dark:to-secondary">Ofertas Recibidas</h1>
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
          <div className="space-y-4">
            {projectsWithBids.map((project) => (
              <Card 
                key={project.id}
                className="border-2 border-secondary/60 hover-elevate cursor-pointer bg-gradient-to-br from-secondary/20 to-purple-100/30 dark:from-secondary/30 dark:to-purple-900/20 shadow-md"
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
                    <div className="flex items-center gap-2 bg-secondary/40 dark:bg-secondary/50 px-3 py-2 rounded-lg">
                      <Zap className="h-5 w-5 text-secondary" />
                      <span className="font-bold text-secondary">{project.bidCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Zap}
            title="No hay ofertas"
            description="Aún no has recibido ofertas en tus proyectos"
          />
        )}
      </main>
    </div>
  );
}
