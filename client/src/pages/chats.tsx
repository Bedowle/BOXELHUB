import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChatDialog } from "@/components/ChatDialog";
import { EmptyState } from "@/components/EmptyState";
import { ArrowLeft, MessageCircle, Search } from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { User } from "@shared/schema";

interface ConversationWithUnread {
  userId: string;
  projectId?: string | null;
  user?: User;
  project?: { name: string } | null;
  lastMessage?: any;
  unreadCount: number;
}

export default function ChatsPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: conversations } = useQuery<ConversationWithUnread[]>({
    queryKey: ["/api/my-conversations-full"],
    enabled: !!user,
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando chats...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalUnread = conversations?.reduce((sum, conv) => sum + conv.unreadCount, 0) || 0;

  const openChat = (chatUser: User, projectId?: string | null) => {
    setSelectedChatUser(chatUser);
    setSelectedProjectId(projectId || null);
    setChatDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 dark:via-slate-900/50 to-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 dark:from-primary/20 dark:via-slate-900/50 dark:to-secondary/20 backdrop-blur-md border-b border-primary/20">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(user.userType === "client" ? "/client" : "/maker")}
            className="flex items-center gap-2 hover-elevate"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Content Header */}
        <div className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-2xl p-8 border border-primary/20 dark:border-primary/30">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 flex items-center gap-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          <MessageCircle className="h-10 w-10 text-primary" />
          Mis Chats
        </h1>
        <p className="text-lg text-muted-foreground">
          {conversations?.length || 0} conversación{(conversations?.length || 0) !== 1 ? "es" : ""}
          {totalUnread > 0 && (
            <span className="ml-3 font-semibold text-accent">
              ({totalUnread} mensaje{totalUnread !== 1 ? "s" : ""} sin leer)
            </span>
          )}
        </p>
        </div>

        {/* Conversations List */}
        {!conversations || conversations.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Sin conversaciones"
            description="No tienes conversaciones aún. Comienza a contactar makers o clientes"
          />
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <Card
                key={`${conv.userId}-${conv.projectId}`}
                className="hover-elevate cursor-pointer transition-all border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/15 dark:to-transparent"
                onClick={() => conv.user && openChat(conv.user, conv.projectId)}
                data-testid={`card-chat-${conv.userId}-${conv.projectId}`}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg">
                          {conv.project?.name && (conv.user?.username || conv.user?.email) ? (
                            <>
                              {conv.project.name}
                              {" con "}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  conv.user?.id && setLocation(`/user/${conv.user.id}`);
                                }}
                                className="hover:text-primary hover-elevate cursor-pointer transition-colors"
                                data-testid="button-view-user-profile"
                              >
                                {conv.user.username || conv.user.email}
                              </button>
                            </>
                          ) : conv.project?.name ? (
                            conv.project.name
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                conv.user?.id && setLocation(`/user/${conv.user.id}`);
                              }}
                              className="hover:text-primary hover-elevate cursor-pointer transition-colors"
                              data-testid="button-view-user-profile"
                            >
                              {conv.user?.username || conv.user?.email || "Usuario"}
                            </button>
                          )}
                        </h3>
                        {conv.unreadCount > 0 && (
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <div className="text-sm text-muted-foreground">
                          <p className={`line-clamp-2 mb-1 ${!conv.lastMessage.isRead && conv.lastMessage.receiverId === user.id ? "font-semibold text-foreground" : ""}`}>
                            {conv.lastMessage.content}
                          </p>
                          <p className="text-xs">
                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { locale: es, addSuffix: true })}
                          </p>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        conv.user && openChat(conv.user, conv.projectId);
                      }}
                      data-testid={`button-open-chat-${conv.userId}-${conv.projectId}`}
                    >
                      Abrir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Chat Dialog */}
      {selectedChatUser && (
        <ChatDialog
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
          otherUser={selectedChatUser}
          currentUserId={user.id}
          projectId={selectedProjectId || undefined}
        />
      )}
    </div>
  );
}
