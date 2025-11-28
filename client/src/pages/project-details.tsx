import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { STLViewer } from "@/components/STLViewer";
import { BidCard } from "@/components/BidCard";
import { BidSubmissionDialog } from "@/components/BidSubmissionDialog";
import { BidEditDialog } from "@/components/BidEditDialog";
import { ChatDialog } from "@/components/ChatDialog";
import { RatingDialog } from "@/components/RatingDialog";
import { EmptyState } from "@/components/EmptyState";
import { BidCardSkeleton } from "@/components/LoadingSkeleton";
import { ArrowLeft, Calendar, FileText, Package, MessageCircle, Trash2, Download } from "lucide-react";
import JSZip from "jszip";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Project, Bid, User, MakerProfile } from "@shared/schema";

export default function ProjectDetails() {
  const [match, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const { user, isClient, isMaker, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [editBidDialogOpen, setEditBidDialogOpen] = useState(false);
  const [selectedBidForEdit, setSelectedBidForEdit] = useState<Bid | null>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedMaker, setSelectedMaker] = useState<User | null>(null);
  const [selectedBidForRating, setSelectedBidForRating] = useState<string | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [stlIndex, setStlIndex] = useState(0);
  const [showBids, setShowBids] = useState(false); // Lazy load bids

  const projectId = params?.id;

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId && !!user,
  });

  const { data: bids, isLoading: bidsLoading } = useQuery<(Bid & { maker?: User & { makerProfile?: MakerProfile | null } })[]>({
    queryKey: ["/api/projects", projectId, "bids"],
    enabled: !!projectId && !!user && showBids, // Only load when needed
  });

  const { data: unreadBidCount } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/projects", projectId, "unread-bid-count"],
    enabled: !!projectId && !!user && isClient,
  });

  const { data: myBid } = useQuery<Bid | null>({
    queryKey: ["/api/projects", projectId, "my-bid"],
    enabled: !!projectId && !!user && isMaker,
  });

  const { data: acceptedBid } = useQuery<(Bid & { maker?: User & { makerProfile?: MakerProfile | null } }) | null>({
    queryKey: ["/api/projects", projectId, "accepted-bid"],
    enabled: !!projectId && !!user && isClient,
  });

  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      await apiRequest("PUT", `/api/bids/${bidId}/accept`, {});
    },
    onSuccess: () => {
      toast({
        title: "Oferta aceptada",
        description: "El maker ha sido notificado. Puedes contactarlo para coordinar la entrega.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "accepted-bid"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "unread-bid-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/total-unread-bids"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Iniciando sesión...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "No se pudo aceptar la oferta",
        variant: "destructive",
      });
    },
  });

  const rejectBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      await apiRequest("PUT", `/api/bids/${bidId}/reject`, {});
    },
    onSuccess: () => {
      toast({
        title: "Oferta rechazada",
        description: "El maker ha sido notificado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "my-bid"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "unread-bid-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/total-unread-bids"] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/projects/${projectId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Proyecto eliminado",
        description: "Tu proyecto ha sido eliminado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/my-projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/stats"] });
      setTimeout(() => {
        setLocation("/client/projects-active");
      }, 1000);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Iniciando sesión...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el proyecto",
        variant: "destructive",
      });
    },
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: async ({ bidId, rating, comment }: { bidId: string; rating: number; comment?: string }) => {
      await apiRequest("PUT", `/api/bids/${bidId}/confirm-delivery`, { rating, comment });
    },
    onSuccess: () => {
      toast({
        title: "Entrega confirmada",
        description: "Has confirmado la recepción del proyecto. El maker ha sido notificado.",
      });
      setRatingDialogOpen(false);
      setSelectedBidForRating(null);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "bids"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Iniciando sesión...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "No se pudo confirmar la entrega",
        variant: "destructive",
      });
    },
  });

  const handleDownloadSTL = async () => {
    if (!projectId || !project) return;
    try {
      console.log("[ProjectDetails] Starting STL download for project:", projectId);
      const checkResponse = await fetch(`/api/projects/${projectId}/download-stl`, {
        credentials: "include",
      });
      if (!checkResponse.ok) {
        throw new Error("Failed to get STL info");
      }
      const fileInfo = await checkResponse.json();
      console.log("[ProjectDetails] File info:", fileInfo);
      
      const stlCount = (project as any).stlFileNames?.length || 1;
      console.log("[ProjectDetails] Number of STL files:", stlCount);
      
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
            console.log("[ProjectDetails] Added to ZIP:", fileName);
          } catch (e) {
            console.error("[ProjectDetails] Error downloading STL", i, ":", e);
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
      console.error("[ProjectDetails] Download error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo descargar los STL",
        variant: "destructive",
      });
    }
  };

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

  // Mark bids as read when client opens project
  useEffect(() => {
    if (isClient && projectId && user?.id) {
      const markAsRead = async () => {
        try {
          await fetch(`/api/projects/${projectId}/mark-bids-read`, {
            method: "PUT",
            credentials: "include",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "unread-bid-count"] });
          queryClient.invalidateQueries({ queryKey: ["/api/projects/unread-bid-counts"] });
          queryClient.invalidateQueries({ queryKey: ["/api/projects/total-unread-bids"] });
        } catch (error) {
          console.error("Error marking bids as read:", error);
        }
      };
      markAsRead();
    }
  }, [isClient, projectId, user?.id, queryClient]);

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

  const isOwner = isClient && project.userId === user.id;
  const isDeleted = project.deletedAt;
  const canBid = isMaker && project.status === "active" && (!myBid || myBid.status === "rejected");
  const canDelete = isOwner && project.status !== "completed" && !isDeleted;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {isDeleted && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              Este proyecto ha sido eliminado. Estás viendo una versión de solo lectura.
            </p>
          </div>
        )}
        {/* Project Layout - Description Left, 3D Viewer Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start lg:items-stretch">
          {/* Left - Project Details */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold" data-testid="text-project-title">
                    {project.name}
                  </h1>
                  <StatusBadge status={project.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground text-lg" data-testid="text-project-description">
                  {project.description}
                </p>
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
                <div className="flex flex-wrap gap-3 pt-4">
                  {isMaker && !isDeleted && project?.status !== "completed" && (
                    <Button 
                      size="lg"
                      variant="default"
                      onClick={handleDownloadSTL}
                      data-testid="button-download-stl"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar STL
                    </Button>
                  )}
                  {canBid && !isDeleted && (
                    <Button 
                      size="lg"
                      onClick={() => setBidDialogOpen(true)}
                      data-testid="button-submit-bid"
                    >
                      Enviar Oferta
                    </Button>
                  )}
                  {isOwner && acceptedBid && acceptedBid.maker && !isDeleted && (
                    <Button 
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        setSelectedMaker(acceptedBid.maker!);
                        setChatDialogOpen(true);
                      }}
                      data-testid="button-chat-maker"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chatear con {acceptedBid.maker.username || acceptedBid.maker.email}
                    </Button>
                  )}
                  {isOwner && !deleteConfirmed && canDelete && (
                    <Button 
                      size="lg"
                      variant="destructive"
                      onClick={() => setDeleteConfirmed(true)}
                      data-testid="button-delete-project"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Proyecto
                    </Button>
                  )}
                  {isOwner && deleteConfirmed && (
                    <div className="flex gap-2">
                      <Button 
                        size="lg"
                        variant="destructive"
                        onClick={() => deleteProjectMutation.mutate()}
                        disabled={deleteProjectMutation.isPending}
                        data-testid="button-confirm-delete"
                      >
                        Confirmar Eliminación
                      </Button>
                      <Button 
                        size="lg"
                        variant="outline"
                        onClick={() => setDeleteConfirmed(false)}
                        data-testid="button-cancel-delete"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - 3D Model */}
          {!isDeleted && (
            <div className="lg:col-span-1">
              <Card className="h-full flex flex-col">
                <CardContent className="py-6 px-4 flex items-center justify-center flex-1">
                  <STLViewer 
                    projectId={project.id} 
                    width={280} 
                    height={240}
                    stlIndex={stlIndex}
                    onIndexChange={setStlIndex}
                    totalStls={(project?.stlFileNames?.length || project?.stlFileName ? Math.max(project?.stlFileNames?.length || 0, 1) : 1)}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Bids Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {isOwner ? "Ofertas Recibidas" : "Ofertas"}
            {bids && bids.length > 0 && (
              <span className="text-muted-foreground font-normal text-lg ml-2">
                ({bids.length})
              </span>
            )}
          </h2>

          {!showBids && isOwner ? (
            <EmptyState
              icon={Package}
              title="Ofertas Pendientes"
              description="Carga las ofertas que han recibido tus proyectos"
              actionLabel="Cargar ofertas"
              onAction={() => setShowBids(true)}
            />
          ) : bidsLoading ? (
            <div className="space-y-4">
              <BidCardSkeleton />
              <BidCardSkeleton />
            </div>
          ) : myBid && isMaker && myBid.status !== "rejected" ? (
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-4">Tu oferta para este proyecto:</p>
              <BidCard 
                bid={myBid} 
                isClient={false}
                isMyBid={true}
                currentUserId={user?.id}
                currentUserName={user?.username || user?.firstName || user?.email}
                isProjectDeleted={project?.deletedAt ? true : false}
                onEdit={(bidId) => {
                  const bid = myBid;
                  setSelectedBidForEdit(bid);
                  setEditBidDialogOpen(true);
                }}
                onRebid={() => setBidDialogOpen(true)}
              />
            </div>
          ) : bids && bids.length > 0 ? (
            <div className="space-y-4">
              {bids.map((bid) => (
                <BidCard
                  key={bid.id}
                  bid={bid}
                  isClient={isOwner}
                  isMyBid={isMaker && bid.makerId === user?.id}
                  currentUserId={user?.id}
                  currentUserName={isMaker && bid.makerId === user?.id ? (user?.username || user?.firstName || user?.email) : undefined}
                  isProjectDeleted={project?.deletedAt ? true : false}
                  onAccept={(bidId) => acceptBidMutation.mutate(bidId)}
                  onReject={(bidId) => rejectBidMutation.mutate(bidId)}
                  onConfirmDelivery={(bidId) => {
                    setSelectedBidForRating(bidId);
                    setRatingDialogOpen(true);
                  }}
                  onEdit={(bidId) => {
                    setSelectedBidForEdit(bid);
                    setEditBidDialogOpen(true);
                  }}
                  onRebid={() => setBidDialogOpen(true)}
                  onContact={(makerId, projectId) => {
                    const makerUser = bid.maker;
                    if (makerUser) {
                      setSelectedMaker(makerUser);
                      setChatDialogOpen(true);
                    }
                  }}
                  isPending={acceptBidMutation.isPending || rejectBidMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title={isOwner ? "No hay ofertas aún" : isMaker && myBid ? "Ya has hecho una oferta" : isMaker ? "Todavía no has hecho ninguna oferta" : "Este proyecto no tiene ofertas"}
              description={isOwner 
                ? "Los makers comenzarán a enviar ofertas pronto. Te notificaremos cuando lleguen."
                : isMaker && myBid
                  ? "Tu oferta está pendiente de revisión"
                  : isMaker
                  ? undefined
                  : canBid 
                  ? "Sé el primero en enviar una oferta para este proyecto"
                  : "Este proyecto ya tiene ofertas de otros makers"}
              actionLabel={canBid || isMaker ? "Enviar Oferta" : undefined}
              onAction={(canBid || isMaker) ? () => setBidDialogOpen(true) : undefined}
            />
          )}
        </div>
      </main>

      {canBid && (
        <BidSubmissionDialog
          open={bidDialogOpen}
          onOpenChange={setBidDialogOpen}
          projectId={projectId!}
        />
      )}

      {selectedBidForEdit && (
        <BidEditDialog
          open={editBidDialogOpen}
          onOpenChange={setEditBidDialogOpen}
          bidId={selectedBidForEdit.id}
          projectId={projectId!}
          currentPrice={selectedBidForEdit.price}
          currentDeliveryDays={selectedBidForEdit.deliveryDays}
          currentMessage={selectedBidForEdit.message || ""}
        />
      )}

      {selectedMaker && user && (
        <ChatDialog
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
          otherUser={selectedMaker}
          currentUserId={user.id}
          projectId={projectId!}
        />
      )}

      {selectedBidForRating && (
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          title="Califica al Maker"
          description="Comparte tu experiencia con este maker. Tu calificación ayudará a otros clientes a tomar mejores decisiones."
          targetName={bids?.find((b) => b.id === selectedBidForRating)?.maker?.firstName || "Maker"}
          onSubmit={(rating, comment) => {
            confirmDeliveryMutation.mutate({ bidId: selectedBidForRating, rating, comment });
          }}
          isLoading={confirmDeliveryMutation.isPending}
        />
      )}
    </div>
  );
}
