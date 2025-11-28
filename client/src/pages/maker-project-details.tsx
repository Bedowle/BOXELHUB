import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { ChatDialog } from "@/components/ChatDialog";
import { BidEditDialog } from "@/components/BidEditDialog";
import { BidSubmissionDialog } from "@/components/BidSubmissionDialog";
import { ArrowLeft, Calendar, FileText, Package, Download, MessageCircle, Edit2 } from "lucide-react";
import JSZip from "jszip";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Project, User } from "@shared/schema";

export default function MakerProjectDetails() {
  const [match, params] = useRoute("/maker/project/:id");
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [editBidDialogOpen, setEditBidDialogOpen] = useState(false);
  const [rebidDialogOpen, setRebidDialogOpen] = useState(false);
  const [projectOwner, setProjectOwner] = useState<User | null>(null);
  const [stlIndex, setStlIndex] = useState(0);

  const projectId = params?.id;

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
        title: "No autorizado",
        description: "Iniciando sesión...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast]);

  if (!match || authLoading || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (!user || !project) {
    return null;
  }

  const handleDownloadSTL = async () => {
    try {
      console.log("[Download] Starting STL download for project:", projectId);
      const checkResponse = await fetch(`/api/projects/${projectId}/download-stl`, {
        credentials: "include",
      });
      if (!checkResponse.ok) {
        throw new Error("Failed to get STL info");
      }
      const fileInfo = await checkResponse.json();
      console.log("[Download] File info:", fileInfo);
      
      const stlCount = (project as any).stlFileNames?.length || 1;
      console.log("[Download] Number of STL files:", stlCount);
      
      if (stlCount > 1) {
        // Download multiple files as ZIP
        const zip = new JSZip();
        
        for (let i = 0; i < stlCount; i++) {
          try {
            const contentResponse = await fetch(`/api/projects/${projectId}/stl-content?index=${i}`, {
              credentials: "include",
            });
            if (!contentResponse.ok) continue;
            
            const blob = await contentResponse.blob();
            const fileName = (project as any).stlFileNames?.[i] || `archivo_${i + 1}.stl`;
            zip.file(fileName, blob);
            console.log("[Download] Added to ZIP:", fileName);
          } catch (e) {
            console.error("[Download] Error downloading STL", i, ":", e);
          }
        }
        
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `proyecto_${projectId}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Descargado",
          description: `${stlCount} archivos STL descargados como ZIP`,
        });
      } else {
        // Single file download
        const contentResponse = await fetch(`/api/projects/${projectId}/stl-content`, {
          credentials: "include",
        });
        if (!contentResponse.ok) {
          throw new Error("Failed to download STL content");
        }
        
        const blob = await contentResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileInfo.fileName || `proyecto_${projectId}.stl`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Descargado",
          description: `STL descargado: ${fileInfo.fileName}`,
        });
      }
    } catch (error) {
      console.error("[Download] Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo descargar los STL",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 py-4 sticky top-0 z-50 bg-gradient-to-r from-secondary/10 via-transparent to-primary/10 dark:from-secondary/20 dark:via-slate-900/50 dark:to-primary/20 backdrop-blur-md border-secondary/20">
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
        {/* Project Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold" data-testid="text-project-title">
                    {project.name}
                  </h1>
                  <StatusBadge status={project.status} />
                </div>
                <p className="text-muted-foreground text-lg mb-4" data-testid="text-project-description">
                  {project.description}
                </p>

                {/* Author */}
                {projectOwner && (
                  <div className="mb-4">
                    <button
                      onClick={() => setLocation(`/user/${projectOwner.id}`)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      data-testid="button-view-author-profile"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={projectOwner.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {projectOwner.username?.[0]?.toUpperCase() || projectOwner.email?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      Publicado por:{" "}
                      <span className="font-semibold text-foreground hover:underline">
                        {projectOwner.username || projectOwner.email}
                      </span>
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Material:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                      {project.material}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Archivo:</span>
                    <span className="text-muted-foreground" data-testid="text-stl-filename">
                      {project.stlFileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Publicado:</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:gap-3">
                <Button 
                  onClick={handleDownloadSTL}
                  variant="default"
                  data-testid="button-download-stl"
                  size="lg"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar STL
                </Button>
                <Button 
                  onClick={() => setRebidDialogOpen(true)}
                  variant="outline"
                  data-testid="button-send-offer"
                  size="lg"
                >
                  Enviar Oferta
                </Button>
                {projectOwner && (
                  <Button 
                    variant="outline"
                    onClick={() => setChatDialogOpen(true)}
                    data-testid="button-contact-client"
                    size="lg"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar
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
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Tu Oferta</h3>
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                    Precio: ${myBid.price} • Entrega: {myBid.deliveryDays} días
                  </p>
                  {myBid.status === "accepted" && (
                    <p className="text-sm text-green-700 dark:text-green-300 font-semibold mt-2">
                      ✓ Tu oferta ha sido aceptada
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
                    {myBid.status === 'accepted' ? 'Aceptada' : myBid.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                  </span>
                  {myBid.status === 'pending' && (
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => setEditBidDialogOpen(true)}
                      data-testid="button-edit-bid"
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Editar Oferta
                    </Button>
                  )}
                  {myBid.status === 'rejected' && (
                    <Button 
                      size="sm"
                      onClick={() => setRebidDialogOpen(true)}
                      data-testid="button-rebid-rejected"
                    >
                      Volver a Ofertar
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

      {projectId && (
        <BidSubmissionDialog
          open={rebidDialogOpen}
          onOpenChange={setRebidDialogOpen}
          projectId={projectId}
        />
      )}
    </div>
  );
}
