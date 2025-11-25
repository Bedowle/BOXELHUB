import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRoute, useLocation } from "wouter";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { ArrowLeft, Star, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Review, User } from "@shared/schema";

interface ReviewWithAuthor extends Review {
  fromUser?: User;
}

export default function MakerReviews() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [userMatch, userParams] = useRoute("/user/:userId/reviews");
  const targetUserId = userParams?.userId;
  const isOwnReviews = !targetUserId; // If no userId param, showing own reviews

  const { data: reviews = [], isLoading } = useQuery<ReviewWithAuthor[]>({
    queryKey: isOwnReviews ? ["/api/reviews/my-reviews"] : ["/api/makers", targetUserId, "reviews"],
    queryFn: async () => {
      if (isOwnReviews) {
        const res = await fetch("/api/reviews/my-reviews", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch reviews");
        return res.json();
      } else {
        const res = await fetch(`/api/makers/${targetUserId}/reviews`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch reviews");
        return res.json();
      }
    },
    enabled: !!user && (isOwnReviews || !!targetUserId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando reseñas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{isOwnReviews ? "Mis Reseñas" : "Reseñas del Maker"}</h1>
          <p className="text-muted-foreground">
            {reviews.length} reseña{reviews.length !== 1 ? "s" : ""} recibida{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Sin reseñas"
            description={isOwnReviews ? "Aún no has recibido ninguna reseña. Cuando completes tus primeros proyectos, tus clientes podrán valorarte." : "Este maker aún no ha recibido ninguna reseña."}
          />
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card 
                key={review.id} 
                className="overflow-hidden cursor-pointer hover-elevate"
                onClick={() => review.projectId && setLocation(`/project/${review.projectId}`)}
                data-testid={`button-view-project-${review.projectId}`}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-4">
                    {/* Review Header */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          review.fromUser?.id && setLocation(`/user/${review.fromUser.id}`);
                        }}
                        className="flex items-center gap-3 hover-elevate cursor-pointer transition-colors rounded-md p-1"
                        data-testid="button-view-user-profile"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.fromUser?.profileImageUrl || ""} alt={review.fromUser?.username || review.fromUser?.email || "Usuario"} />
                          <AvatarFallback>
                            {(review.fromUser?.username || review.fromUser?.email || "U").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="font-semibold hover:text-primary">{review.fromUser?.username || review.fromUser?.email || "Usuario Anónimo"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { locale: es, addSuffix: true })}
                          </p>
                        </div>
                      </button>

                      {/* Rating Stars & Project Link */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => {
                              const rating = parseFloat(String(review.rating || 0));
                              return (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(rating)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : i < rating
                                      ? "fill-yellow-400 text-yellow-400 opacity-50"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              );
                            })}
                          </div>
                          <Badge variant="outline">
                            {parseFloat(String(review.rating || 0)).toFixed(1)}
                          </Badge>
                        </div>
                        {review.projectId && (
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Review Comment */}
                    {review.comment && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-foreground">{review.comment}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
