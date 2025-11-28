import { Star } from "lucide-react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "@shared/schema";

interface ViewRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rating?: number;
  comment?: string;
  fromUser?: User | null;
  isLoading?: boolean;
}

export function ViewRatingDialog({
  open,
  onOpenChange,
  rating = 0,
  comment,
  fromUser,
  isLoading = false,
}: ViewRatingDialogProps) {
  const [, setLocation] = useLocation();
  
  const handleUserClick = () => {
    if (fromUser?.id) {
      setLocation(`/user/${fromUser.id}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-view-rating">
        <DialogHeader>
          <DialogTitle>Calificación Recibida</DialogTitle>
          <DialogDescription>
            De {fromUser?.username || fromUser?.firstName || "Cliente"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {fromUser && (
            <button
              onClick={handleUserClick}
              className="flex items-center gap-3 hover-elevate p-2 rounded-lg transition-colors"
              data-testid="button-view-user-profile"
            >
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={fromUser.profileImageUrl || ""} alt={fromUser.username || "Usuario"} />
                <AvatarFallback>
                  {(fromUser.username || fromUser.firstName || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-semibold hover:text-primary">{fromUser.username || fromUser.firstName || "Usuario"}</p>
                {fromUser.showFullName && fromUser.firstName && fromUser.lastName && (
                  <p className="text-sm text-muted-foreground">{fromUser.firstName} {fromUser.lastName}</p>
                )}
              </div>
            </button>
          )}
          <div>
            <label className="block text-sm font-medium mb-3">
              Puntuación
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => {
                  const ratingNum = typeof rating === 'string' ? parseFloat(rating) : (rating || 0);
                  return (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(ratingNum)
                          ? "fill-yellow-400 text-yellow-400"
                          : i < ratingNum
                          ? "fill-yellow-400 text-yellow-400 opacity-50"
                          : "text-muted-foreground"
                      }`}
                    />
                  );
                })}
              </div>
              <span className="font-semibold text-lg">
                {typeof rating === 'string' ? rating : rating?.toFixed(1)}
              </span>
            </div>
          </div>

          {comment && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Comentario
              </label>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-foreground">{comment}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
