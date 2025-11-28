import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ViewRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rating?: number;
  comment?: string;
  fromUserName?: string;
  isLoading?: boolean;
}

export function ViewRatingDialog({
  open,
  onOpenChange,
  rating = 0,
  comment,
  fromUserName = "Cliente",
  isLoading = false,
}: ViewRatingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-view-rating">
        <DialogHeader>
          <DialogTitle>Calificación Recibida</DialogTitle>
          <DialogDescription>
            Calificación de {fromUserName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
