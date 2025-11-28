import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, MessageCircle, Edit2 } from "lucide-react";
import type { Bid, User, MakerProfile } from "@shared/schema";

interface BidCardProps {
  bid: Bid & { 
    maker?: User & { makerProfile?: MakerProfile | null }
  };
  onAccept?: (bidId: string) => void;
  onReject?: (bidId: string) => void;
  onContact?: (makerId: string, projectId: string) => void;
  onConfirmDelivery?: (bidId: string) => void;
  onEdit?: (bidId: string) => void;
  onRebid?: () => void;
  isClient?: boolean;
  isMyBid?: boolean;
  currentUserId?: string;
  currentUserName?: string;
  isPending?: boolean;
  isProjectDeleted?: boolean;
}

export function BidCard({ bid, onAccept, onReject, onContact, onConfirmDelivery, onEdit, onRebid, isClient, isMyBid, currentUserId, currentUserName, isPending, isProjectDeleted }: BidCardProps) {
  const [, setLocation] = useLocation();
  const profile = bid.maker?.makerProfile;
  const initials = (bid.maker?.username || bid.maker?.email)?.[0].toUpperCase() || "M";
  
  const canEditBid = isMyBid && bid.status === "pending" && currentUserId === bid.makerId && !isProjectDeleted;

  const handleCardClick = () => {
    if (isClient && onContact) {
      onContact(bid.makerId, bid.projectId);
    }
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    const profileId = isMyBid && currentUserId ? currentUserId : bid.maker?.id;
    if (profileId) {
      setLocation(`/user/${profileId}`);
    }
  };

  return (
    <Card 
      className={`border ${!isProjectDeleted ? 'hover:border-primary/50 transition-colors hover-elevate active-elevate-2 cursor-pointer' : ''}`}
      onClick={handleCardClick}
      data-testid={`card-bid-${bid.id}`}
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Maker Info */}
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-14 w-14 flex-shrink-0">
              <AvatarImage src={bid.maker?.profileImageUrl || undefined} alt={initials} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={handleViewProfile}
                  className="font-semibold text-lg hover:text-primary hover-elevate cursor-pointer transition-colors"
                  data-testid={`text-maker-name-${bid.id}`}
                >
                  {isMyBid && currentUserName ? currentUserName : bid.maker?.username || bid.maker?.email || bid.maker?.id || "Desconocido"}
                </button>
                {profile && (
                  <Badge variant="secondary" className="text-xs">
                    {profile.printerType}
                  </Badge>
                )}
              </div>
              {profile && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  {profile.rating && parseFloat(profile.rating) > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {parseFloat(profile.rating).toFixed(1)}
                      <span className="text-xs">({profile.totalReviews})</span>
                    </span>
                  )}
                  {profile.location && (
                    <span>{profile.location}</span>
                  )}
                </div>
              )}
              {bid.message && (
                <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-bid-message-${bid.id}`}>
                  {bid.message}
                </p>
              )}
              {profile?.capabilities && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {profile.capabilities}
                </p>
              )}
            </div>
          </div>

          {/* Bid Details */}
          <div className="flex flex-col items-end justify-between gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-3xl font-bold text-primary" data-testid={`text-bid-price-${bid.id}`}>
                €{parseFloat(bid.price).toFixed(2)}
              </p>
              <p className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground mt-1" data-testid={`text-bid-delivery-${bid.id}`}>
                <Clock className="h-4 w-4" />
                {bid.deliveryDays} días
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 items-end">
              {/* Pending bid status badge - but show as rejected if project deleted */}
              {(bid.status === "pending" || bid.status === undefined || bid.status === null) && !isProjectDeleted && (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" data-testid={`badge-pending-${bid.id}`}>
                  Pendiente
                </Badge>
              )}
              
              {/* If project deleted, pending bids are treated as rejected */}
              {(bid.status === "pending" || bid.status === undefined || bid.status === null) && isProjectDeleted && (
                <Badge variant="secondary" data-testid={`badge-rejected-deleted-${bid.id}`}>
                  Rechazada
                </Badge>
              )}

              {/* Chat button - Available for clients only if project not deleted */}
              {isClient && !isProjectDeleted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onContact?.(bid.makerId, bid.projectId)}
                  disabled={isPending}
                  data-testid={`button-contact-${bid.id}`}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Chat
                </Button>
              )}

              {/* Pending bid actions */}
              {isClient && (bid.status === "pending" || bid.status === undefined || bid.status === null) && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReject?.(bid.id)}
                    disabled={isPending}
                    data-testid={`button-reject-${bid.id}`}
                  >
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAccept?.(bid.id)}
                    disabled={isPending}
                    data-testid={`button-accept-${bid.id}`}
                  >
                    Aceptar
                  </Button>
                </div>
              )}

              {/* Maker edit button */}
              {canEditBid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(bid.id)}
                  disabled={isPending}
                  data-testid={`button-edit-bid-${bid.id}`}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}

              {/* Accepted bid status and actions */}
              {bid.status === "accepted" && (
                <>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Aceptada
                  </Badge>
                  {isClient && !bid.deliveryConfirmedAt && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onConfirmDelivery?.(bid.id)}
                      disabled={isPending}
                      data-testid={`button-confirm-delivery-${bid.id}`}
                    >
                      Confirmar Recepción
                    </Button>
                  )}
                  {bid.deliveryConfirmedAt && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                      Entrega Confirmada
                    </Badge>
                  )}
                </>
              )}

              {/* Rejected bid status */}
              {bid.status === "rejected" && (
                <>
                  <Badge variant="secondary">
                    Rechazada
                  </Badge>
                  {isMyBid && onRebid && (
                    <Button
                      size="sm"
                      onClick={onRebid}
                      data-testid={`button-rebid-${bid.id}`}
                    >
                      Volver a Ofertar
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
