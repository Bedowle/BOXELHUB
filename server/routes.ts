import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Review, User } from "@shared/schema";

interface ReviewCardProps {
  review: Review & { fromUser?: User };
}

export function ReviewCard({ review, }: ReviewCardProps) {
  const rating = typeof review.rating === "string" ? parseFloat(review.rating) : review.rating;

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <Avatar>
          <AvatarImage src={review.fromUser?.profileImageUrl || undefined} />
          <AvatarFallback>
            {review.fromUser?.firstName?.[0] || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="font-semibold">
              {review.fromUser?.firstName || "Usuario"}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : i === Math.floor(rating) && rating % 1 !== 0
                      ? "fill-yellow-200 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="text-sm font-medium ml-1">{rating}</span>
            </div>
          </div>

          {review.comment && (
            <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
          )}

          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(review.createdAt), {
              locale: es,
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </Card>
  );
}
