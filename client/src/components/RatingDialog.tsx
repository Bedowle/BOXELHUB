import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  targetName: string;
  onSubmit: (rating: number, comment?: string) => void;
  isLoading?: boolean;
}

export function RatingDialog({
  open,
  onOpenChange,
  title,
  description,
  targetName,
  onSubmit,
  isLoading,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      return;
    }
    onSubmit(rating, comment);
    setRating(0);
    setComment("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="dialog-rating">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">
              Mi calificación para {targetName}
            </label>
            <div className="flex gap-2" data-testid="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star * 0.5)}
                  onMouseEnter={() => setHoverRating(star * 0.5)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={isLoading}
                  className="transition-transform hover:scale-110"
                  data-testid={`rating-star-${star}`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      (hoverRating || rating) >= star * 0.5
                        ? "fill-yellow-400 text-yellow-400"
                        : (hoverRating || rating) >= star * 0.5 - 0.5
                        ? "fill-yellow-200 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {rating} / 5 estrellas
              </p>
            )}
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-2">
              Comentario (opcional)
            </label>
            <Textarea
              id="comment"
              placeholder="Comparte tu experiencia con este maker..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isLoading}
              className="resize-none"
              data-testid="input-comment"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            data-testid="button-cancel"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isLoading}
            data-testid="button-submit-rating"
          >
            {isLoading ? "Enviando..." : "Enviar Calificación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
