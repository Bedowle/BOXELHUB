import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage.tsx";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { ChatDialog } from "@/components/ChatDialog";
import { BidEditDialog } from "@/components/BidEditDialog";
import { ArrowLeft, Calendar, FileText, Package, Download, MessageCircle, Edit2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { Project, User } from "@shared/schema";

export default function MakerProjectDetails() {
  const [match, params] = useRoute("/maker/project/:id");
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [editBidDialogOpen, setEditBidDialogOpen] = useState(false);
  const [projectOwner, setProjectOwner] = useState<User | null>(null);

  const projectId = params?.id;
  const dateLocale = language === 'es' ? es : enUS;

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId && !!user,
  });

  const { data: myBid } = useQuery<any>({
    queryKey: ["/api/projects", projectId, "my-bid"],
    enabled: !!projectId && !!user,
  });

  // Fetch project owner
  useEffect(() => {
    if (project?.userId) {
      const fetchOwner = async () => {
        try {
          const response = await fetch(`/api/user/${project.userId}`, {
            credentials: "include",
          });
          if (response.ok) {
            const owner = await response.json();
            setProjectOwner(owner);
          }
        } catch (error) {
          console.error("Failed to fetch project owner:", error);
        }
      };
      fetchOwner();
    }
  }, [project?.userId]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: language === 'es' ? "No autorizado" : "Unauthorized",
        description: language === 'es' ? "Iniciando sesión..." : "Signing in...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast, language]);

  if (!match || authLoading || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">language === 'es' ? 'Cargando proyecto...' : 'Loading project...'}</p>
        </div>
      </div>
    );
  }

  if (!user || !project) {
    return null;
  }

  const handleDownloadSTL = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/download-stl`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to download STL");
      }
      const data = await response.json();
      
      toast({
        title: language === 'es' ? "STL Listo" : "STL Ready",
        description: `$language === 'es' ? 'Archivo' : 'File'}: ${data.fileName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: language === 'es' ? "No se pudo descargar el STL" : "Could not download STL",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/maker")}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              language === 'es' ? 'Volver' : 'Back'}
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user.firstName || user.email}
              </span>
              <Button variant="outline" asChild size="sm">
                <a href="/api/logout">language === 'es' ? 'Cerrar Sesión' : 'Logout'}</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Project Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold" data-testid="text-project-title">
                    {project.name}
                  </h1>
                  <StatusBadge status={project.status} />
                </div>
                <p className="text-muted-foreground text-lg mb-4" data-testid="text-project-description">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">language === 'es' ? 'Material' : 'Material'}:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                      {project.material}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">language === 'es' ? 'Archivo' : 'File'}:</span>
                    <span className="text-muted-foreground" data-testid="text-stl-filename">
                      {project.stlFileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">language === 'es' ? 'Publicado' : 'Published'}:</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: dateLocale })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleDownloadSTL}
                  data-testid="button-download-stl"
                >
                  <Download className="mr-2 h-4 w-4" />
                  language === 'es' ? 'Descargar STL' : 'Download STL'}
                </Button>
                {projectOwner && (
                  <Button 
                    variant="outline"
                    onClick={() => setChatDialogOpen(true)}
                    data-testid="button-contact-client"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    language === 'es' ? 'Contactar Cliente' : 'Contact Client'}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* My Bid Info */}
        {myBid && (
          <Card className="mb-8 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">language === 'es' ? 'Tu Oferta' : 'Your Bid'}</h3>
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                    language === 'es' ? 'Precio' : 'Price'}: ${myBid.price} • language === 'es' ? 'Entrega' : 'Delivery'}: {myBid.deliveryDays} language === 'es' ? 'días' : 'days'}
                  </p>
                  {myBid.status === "accepted" && (
                    <p className="text-sm text-green-700 dark:text-green-300 font-semibold mt-2">
                      ✓ language === 'es' ? 'Tu oferta ha sido aceptada' : 'Your bid has been accepted'}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-center ${
                    myBid.status === 'accepted' 
                      ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : myBid.status === 'rejected'
                      ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100'
                      : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                  }`}>
                    {myBid.status === 'accepted' ? (language === 'es' ? 'Aceptada' : 'Accepted') : myBid.status === 'rejected' ? (language === 'es' ? 'Rechazada' : 'Rejected') : (language === 'es' ? 'Pendiente' : 'Pending')}
                  </span>
                  {myBid.status === 'pending' && (
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => setEditBidDialogOpen(true)}
                      data-testid="button-edit-bid"
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      language === 'es' ? 'Editar Oferta' : 'Edit Bid'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {projectOwner && user && (
        <ChatDialog
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
          otherUser={projectOwner}
          currentUserId={user.id}
          projectId={projectId!}
        />
      )}

      {myBid && projectId && (
        <BidEditDialog
          open={editBidDialogOpen}
          onOpenChange={setEditBidDialogOpen}
          bidId={myBid.id}
          projectId={projectId}
          currentPrice={myBid.price}
          currentDeliveryDays={myBid.deliveryDays}
          currentMessage={myBid.message}
        />
      )}
    </div>
  );
}
