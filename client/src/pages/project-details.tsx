import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage.tsx";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { BidCard } from "@/components/BidCard";
import { BidSubmissionDialog } from "@/components/BidSubmissionDialog";
import { BidEditDialog } from "@/components/BidEditDialog";
import { ChatDialog } from "@/components/ChatDialog";
import { RatingDialog } from "@/components/RatingDialog";
import { EmptyState } from "@/components/EmptyState";
import { BidCardSkeleton } from "@/components/LoadingSkeleton";
import { ArrowLeft, Calendar, FileText, Package, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { Project, Bid, User, MakerProfile } from "@shared/schema";

export default function ProjectDetails() {
  const [match, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const { user, isClient, isMaker, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [editBidDialogOpen, setEditBidDialogOpen] = useState(false);
  const [selectedBidForEdit, setSelectedBidForEdit] = useState<Bid | null>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedMaker, setSelectedMaker] = useState<User | null>(null);
  const [selectedBidForRating, setSelectedBidForRating] = useState<string | null>(null);

  const projectId = params?.id;
  const dateLocale = 'English'

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
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "accepted-bid"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t('common.error'),
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
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "bids"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t('common.error'),
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
      });
      setRatingDialogOpen(false);
      setSelectedBidForRating(null);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "bids"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t('common.error'),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
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
              onClick={() => {
                const previousPath = localStorage.getItem('previousProjectPath') || (isClient ? "/" : "/maker");
                setLocation(previousPath);
              }
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user.firstName || user.email}
              </span>
              <Button variant="outline" asChild size="sm">
            {
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
            {
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                      {project.material}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
            {
                    <span className="text-muted-foreground" data-testid="text-stl-filename">
                      {project.stlFileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
            {
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: dateLocale })}
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
                </Button>
              )}
              {isOwner && acceptedBid && acceptedBid.maker && (
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setSelectedMaker(acceptedBid.maker!);
                    setChatDialogOpen(true);
                  }
                  data-testid="button-chat-maker"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Bids Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
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
            {
              <BidCard 
                bid={myBid} 
                isClient={false}
                isMyBid={true}
                currentUserId={user?.id}
                onEdit={(bidId) => {
                  const bid = myBid;
                  setSelectedBidForEdit(bid);
                  setEditBidDialogOpen(true);
                }
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
                  }
                  onEdit={(bidId) => {
                    setSelectedBidForEdit(bid);
                    setEditBidDialogOpen(true);
                  }
                  onContact={(makerId, projectId) => {
                    const makerUser = bid.maker;
                    if (makerUser) {
                      setSelectedMaker(makerUser);
                      setChatDialogOpen(true);
                    }
                  }
                  isPending={acceptBidMutation.isPending || rejectBidMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              description={isOwner 
                : canBid 
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
          title=English
          description=English
          targetName={bids?.find((b) => b.id === selectedBidForRating)?.maker?.firstName || "Maker"}
          onSubmit={(rating, comment) => {
            confirmDeliveryMutation.mutate({ bidId: selectedBidForRating, rating, comment });
          }
          isLoading={confirmDeliveryMutation.isPending}
        />
      )}
    </div>
  );
}
