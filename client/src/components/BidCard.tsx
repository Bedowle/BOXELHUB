import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, MessageCircle } from "lucide-react";
import type { Bid, User, MakerProfile } from "@shared/schema";

interface BidCardProps {
  bid: Bid & { 
    maker?: User & { makerProfile?: MakerProfile | null }
  };
  onAccept?: (bidId: string) => void;
  onReject?: (bidId: string) => void;
  onContact?: (makerId: string) => void;
  onConfirmDelivery?: (bidId: string) => void;
  isClient?: boolean;
  isPending?: boolean;
}

export function BidCard({ bid, onAccept, onReject, onContact, onConfirmDelivery, isClient, isPending }: BidCardProps) {
  const profile = bid.maker?.makerProfile;
  const initials = bid.maker?.firstName && bid.maker?.lastName 
    ? `${bid.maker.firstName[0]}${bid.maker.lastName[0]}`
    : bid.maker?.email?.[0].toUpperCase() || "M";

  return (
    <Card className="border hover:border-primary/50 transition-colors" data-testid={`card-bid-${bid.id}`}>
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
                <h3 className="font-semibold text-lg" data-testid={`text-maker-name-${bid.id}`}>
                  {bid.maker?.firstName && bid.maker?.lastName 
                    ? `${bid.maker.firstName} ${bid.maker.lastName}`
                    : bid.maker?.email || "Maker"}
                </h3>
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
            {isClient && (bid.status === "pending" || bid.status === undefined || bid.status === null) && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onContact?.(bid.makerId)}
                  disabled={isPending}
                  data-testid={`button-contact-${bid.id}`}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Chat
                </Button>
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

            {bid.status === "accepted" && (
              <div className="flex flex-col gap-2 items-end">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  Aceptada
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onContact?.(bid.makerId)}
                  disabled={isPending}
                  data-testid={`button-contact-${bid.id}`}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Chat
                </Button>
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
              </div>
            )}

            {bid.status === "rejected" && (
              <Badge variant="secondary">
                Rechazada
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
