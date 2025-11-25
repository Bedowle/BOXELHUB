import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageCircle, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Message } from "@shared/schema";

export default function MarketplaceDesignChatsPage() {
  const [match, params] = useRoute("/marketplace-design-chats/:designId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const designId = params?.designId;

  // Fetch all conversations with unread counts
  const { data: allConversations = [] } = useQuery({
    queryKey: ["/api/my-conversations-full"],
    queryFn: async () => {
      const res = await fetch("/api/my-conversations-full", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    enabled: !!user,
  });

  // Filter conversations for this design and exclude conversations with yourself
  const designConversations = allConversations.filter(
    (conv: any) => conv.marketplaceDesignId === designId && conv.userId !== user?.id
  );

  // Fetch design details
  const { data: design } = useQuery({
    queryKey: ["/api/marketplace/designs", designId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/designs/${designId}`);
      if (!res.ok) throw new Error("Failed to fetch design");
      return res.json();
    },
    enabled: !!designId,
  });

  if (!match) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5">
      {/* Header */}
      <div className="border-b border-border/50 sticky top-0 z-40 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-back-to-marketplace"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/maker/marketplace")}
              data-testid="button-edit-design"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Diseño
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Conversaciones del Producto</h1>
          </div>
          {design && (
            <p className="text-muted-foreground">
              {design.title} - €{parseFloat(String(design.price)).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {designConversations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-16">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-lg mb-2">Sin conversaciones aún</h3>
                <p className="text-muted-foreground">
                  Los clientes que contacten sobre este producto aparecerán aquí
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {designConversations.map((conv: any) => (
              <Card
                key={`${conv.userId}-${designId}`}
                className="hover-elevate cursor-pointer"
                onClick={() =>
                  setLocation(`/chat/${conv.userId}?marketplaceDesignId=${designId}`)
                }
                data-testid={`card-conversation-${conv.userId}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar>
                        <AvatarImage
                          src={conv.user?.profileImageUrl || undefined}
                        />
                        <AvatarFallback>
                          {conv.user?.username?.[0].toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold" data-testid={`text-user-name-${conv.userId}`}>
                          {conv.user?.username || conv.user?.email}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {conv.lastMessage?.content || "Sin mensajes"}
                        </p>
                        {conv.lastMessage && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(conv.lastMessage.createdAt), "PPp", {
                              locale: es,
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {conv.unreadCount > 0 && (
                      <div
                        className="ml-4 flex-shrink-0 inline-flex items-center justify-center px-2.5 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                        data-testid={`badge-unread-${conv.userId}`}
                      >
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
