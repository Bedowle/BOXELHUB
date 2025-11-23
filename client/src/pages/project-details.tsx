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
import { BidCard } from "@/components/BidCard";
import { BidSubmissionDialog } from "@/components/BidSubmissionDialog";
import { ChatDialog } from "@/components/ChatDialog";
import { RatingDialog } from "@/components/RatingDialog";
import { EmptyState } from "@/components/EmptyState";
import { BidCardSkeleton } from "@/components/LoadingSkeleton";
import { ArrowLeft, Calendar, FileText, Package } from "lucide-react";
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

  const { data: myBid } = useQuery<Bid | null>({
    queryKey: ["/api/projects", projectId, "my-bid"],
    enabled: !!projectId && !!user && isMaker,
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
  const canBid = isMaker && project.status === "active" && !myBid;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setLocation(isClient ? "/" : "/maker")}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
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
              {canBid && (
                <Button 
                  size="lg"
                  onClick={() => setBidDialogOpen(true)}
                  data-testid="button-submit-bid"
                >
                  Enviar Oferta
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

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
          ) : myBid && isMaker ? (
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-4">Tu oferta para este proyecto:</p>
              <BidCard bid={myBid} isClient={false} />
            </div>
          ) : bids && bids.length > 0 ? (
            <div className="space-y-4">
              {bids.map((bid) => (
                <BidCard
                  key={bid.id}
                  bid={bid}
                  isClient={isOwner}
                  onAccept={(bidId) => acceptBidMutation.mutate(bidId)}
                  onReject={(bidId) => rejectBidMutation.mutate(bidId)}
                  onConfirmDelivery={(bidId) => {
                    setSelectedBidForRating(bidId);
                    setRatingDialogOpen(true);
                  }}
                  onContact={(makerId) => {
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

      {selectedMaker && user && (
        <ChatDialog
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
          otherUser={selectedMaker}
          currentUserId={user.id}
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
