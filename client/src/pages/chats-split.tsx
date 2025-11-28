import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatListItem } from "@/components/ChatListItem";
import { ChatWindow } from "@/components/ChatWindow";
import { ArrowLeft, MessageCircle } from "lucide-react";
import type { User } from "@shared/schema";

interface Conversation {
  userId: string;
  projectId?: string;
  marketplaceDesignId?: string;
  lastMessage?: { content: string; createdAt: string };
  unreadCount: number;
  user?: User;
}

interface SelectedConversationKey {
  userId: string;
  projectId?: string;
  marketplaceDesignId?: string;
}

export default function ChatsSplitPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedConvKey, setSelectedConvKey] = useState<SelectedConversationKey | null>(null);

  // Fetch conversations
  const { data: allConversations = [], isLoading } = useQuery({
    queryKey: ["/api/my-conversations-full"],
    queryFn: async () => {
      const res = await fetch("/api/my-conversations-full", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 3000,
  });

  // Fetch other user details
  const { data: otherUser } = useQuery<User | null>({
    queryKey: ["/api/user", selectedConvKey?.userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${selectedConvKey?.userId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedConvKey?.userId,
  });

  const filteredConversations = allConversations;

  // Get selected conversation details - match by userId + context
  const selectedConv = selectedConvKey ? allConversations.find((c: Conversation) => {
    return (
      c.userId === selectedConvKey.userId &&
      c.projectId === selectedConvKey.projectId &&
      c.marketplaceDesignId === selectedConvKey.marketplaceDesignId
    );
  }) : undefined;

  // If no conversation selected, select the first one
  useEffect(() => {
    if (!selectedConvKey && filteredConversations.length > 0) {
      const first = filteredConversations[0];
      setSelectedConvKey({
        userId: first.userId,
        projectId: first.projectId,
        marketplaceDesignId: first.marketplaceDesignId,
      });
    }
  }, [filteredConversations, selectedConvKey]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-blue-50/30 dark:via-slate-900/50 to-background">
      {/* Header */}
      <header className="border-b px-4 py-4 sticky top-0 z-50 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 dark:from-primary/20 dark:via-slate-900/50 dark:to-secondary/20 backdrop-blur-md border-primary/20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="hover-elevate"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Mensajes</h1>
            {user && (
              <p className="text-xs text-muted-foreground">
                {user.firstName || user.email}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Conversations List */}
        <div className="w-80 border-r flex flex-col bg-card/70 backdrop-blur-sm border-primary/10">
          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Cargando conversaciones...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-sm">
                  Sin conversaciones aún
                </p>
              </div>
            ) : (
              filteredConversations.map((conv: Conversation) => {
                const uniqueKey = `${conv.userId}-${conv.projectId || ''}-${conv.marketplaceDesignId || ''}`;
                const isProjectDeleted = conv.projectId && conv.project?.deletedAt;
                const isDesignDeleted = conv.marketplaceDesignId && conv.design?.deletedAt;
                return (
                <ChatListItem
                  key={uniqueKey}
                  userId={conv.userId}
                  userName={(conv.user?.username || conv.user?.email) || undefined}
                  userImage={conv.user?.profileImageUrl || undefined}
                  projectName={conv.project?.name}
                  designName={conv.design?.title}
                  projectImage={conv.project?.stlImageUrl}
                  designImage={conv.design?.imageUrl}
                  projectId={conv.projectId}
                  designId={conv.marketplaceDesignId}
                  projectStatus={conv.project?.status}
                  lastMessage={conv.lastMessage?.content || undefined}
                  lastMessageTime={conv.lastMessage?.createdAt || undefined}
                  unreadCount={conv.unreadCount || 0}
                  isActive={
                    selectedConvKey?.userId === conv.userId &&
                    selectedConvKey?.projectId === conv.projectId &&
                    selectedConvKey?.marketplaceDesignId === conv.marketplaceDesignId
                  }
                  isProjectDeleted={isProjectDeleted}
                  isDesignDeleted={isDesignDeleted}
                  onClick={() =>
                    setSelectedConvKey({
                      userId: conv.userId,
                      projectId: conv.projectId,
                      marketplaceDesignId: conv.marketplaceDesignId,
                    })
                  }
                />
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedConvKey && selectedConv && otherUser ? (
            <ChatWindow
              otherUserId={selectedConvKey.userId}
              otherUser={otherUser}
              currentUserId={user?.id || ""}
              projectId={selectedConv.projectId}
              marketplaceDesignId={selectedConv.marketplaceDesignId}
              project={selectedConv.project}
              design={selectedConv.design}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground">
                  Selecciona una conversación para comenzar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
