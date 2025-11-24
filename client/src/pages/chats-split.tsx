import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatListItem } from "@/components/ChatListItem";
import { ChatWindow } from "@/components/ChatWindow";
import { ArrowLeft, Search, MessageCircle } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter conversations based on search
  const filteredConversations = allConversations.filter((conv: Conversation) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.user?.username?.toLowerCase().includes(searchLower) ||
      conv.user?.email?.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.content?.toLowerCase().includes(searchLower)
    );
  });

  // Get selected conversation details - match by userId + context
  const selectedConv = selectedConvKey ? allConversations.find((c: Conversation) => {
    const match = 
      c.userId === selectedConvKey.userId &&
      c.projectId === selectedConvKey.projectId &&
      c.marketplaceDesignId === selectedConvKey.marketplaceDesignId;
    
    if (!match) {
      console.log(`[ChatsSplit] Checking conversation:`, {
        cUserId: c.userId,
        cProjectId: c.projectId,
        cDesignId: c.marketplaceDesignId,
        selectedUserId: selectedConvKey.userId,
        selectedProjectId: selectedConvKey.projectId,
        selectedDesignId: selectedConvKey.marketplaceDesignId,
      });
    }
    return match;
  }) : undefined;
  
  console.log(`[ChatsSplit] selectedConvKey:`, selectedConvKey, `selectedConv:`, selectedConv);

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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-4 sticky top-0 z-50 bg-background/95 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Mensajes</h1>
            {user && (
              <p className="text-xs text-muted-foreground">
                {user.firstName || user.email}
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" asChild size="sm">
          <a href="/api/logout">Cerrar Sesión</a>
        </Button>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Conversations List */}
        <div className="w-80 border-r flex flex-col bg-card/50">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-conversations"
              />
            </div>
          </div>

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
                  {searchQuery ? "Sin resultados" : "Sin conversaciones aún"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv: Conversation) => {
                const uniqueKey = `${conv.userId}-${conv.projectId || ''}-${conv.marketplaceDesignId || ''}`;
                return (
                <ChatListItem
                  key={uniqueKey}
                  userId={conv.userId}
                  userName={(conv.user?.username || conv.user?.email) || undefined}
                  userImage={conv.user?.profileImageUrl || undefined}
                  lastMessage={conv.lastMessage?.content || undefined}
                  lastMessageTime={conv.lastMessage?.createdAt || undefined}
                  unreadCount={conv.unreadCount || 0}
                  isActive={
                    selectedConvKey?.userId === conv.userId &&
                    selectedConvKey?.projectId === conv.projectId &&
                    selectedConvKey?.marketplaceDesignId === conv.marketplaceDesignId
                  }
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
