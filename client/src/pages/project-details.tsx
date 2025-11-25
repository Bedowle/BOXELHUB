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
import { ArrowLeft, Calendar, FileText, Package, MessageCircle } from "lucide-react";
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

  const projectId = params?.id;

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId && !!user,
  });

  const { data: bids, isLoading: bidsLoading } = useQuery<(Bid & { maker?: User & { makerProfile?: MakerProfile | null } })[]>({
    queryKey: ["/api/projects", projectId, "bids"],
    enabled: !!projectId && !!user,
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
        description: error.message || "No se pudo rechazar la oferta",
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

  const isOwner = isClient && project.userId === user.id;
  const canBid = isMaker && project.status === "active" && (!myBid || myBid.status === "rejected");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                data-testid="button-back"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              {isClient && unreadBidCount && unreadBidCount.unreadCount > 0 && (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold" data-testid="badge-unread-header">
                  {unreadBidCount.unreadCount > 9 ? '9+' : unreadBidCount.unreadCount}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user.firstName || user.email}
              </span>
              <Button variant="outline" asChild size="sm">
                <a href="/api/logout">Cerrar Sesión</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
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
                  {canBid && (
                    <Button 
                      size="lg"
                      onClick={() => setBidDialogOpen(true)}
                      data-testid="button-submit-bid"
                    >
                      Enviar Oferta
                    </Button>
                  )}
                  {isOwner && acceptedBid && acceptedBid.maker && (
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - 3D Model */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardContent className="py-6 px-4 flex items-center justify-center flex-1">
                <STLViewer projectId={project.id} width={280} height={240} />
              </CardContent>
            </Card>
          </div>
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

          {bidsLoading ? (
            <div className="space-y-4">
              <BidCardSkeleton />
              <BidCardSkeleton />
            </div>
          ) : (myBid && isMaker && myBid.status !== "rejected") ? (
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-4">Tu oferta para este proyecto:</p>
              <BidCard 
                bid={myBid} 
                isClient={false}
                isMyBid={true}
                currentUserId={user?.id}
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
              title={isOwner ? "No hay ofertas aún" : "Este proyecto no tiene ofertas"}
              description={isOwner 
                ? "Los makers comenzarán a enviar ofertas pronto. Te notificaremos cuando lleguen."
                : canBid 
                  ? "Sé el primero en enviar una oferta para este proyecto"
                  : "Este proyecto ya tiene ofertas de otros makers"}
              actionLabel={canBid ? "Enviar Oferta" : undefined}
              onAction={canBid ? () => setBidDialogOpen(true) : undefined}
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
