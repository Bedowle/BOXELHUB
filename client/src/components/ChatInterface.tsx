import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Message, User } from "@shared/schema";

interface ChatInterfaceProps {
  otherUserId: string;
  otherUser: User | undefined;
  currentUserId: string;
  projectId?: string;
  marketplaceDesignId?: string;
}

export function ChatInterface({ otherUserId, otherUser, currentUserId, projectId, marketplaceDesignId }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const markReadTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", projectId, marketplaceDesignId, otherUserId],
    queryFn: async () => {
      try {
        let url = `/api/messages?otherUserId=${encodeURIComponent(otherUserId)}`;
        if (projectId) {
          url += `&projectId=${encodeURIComponent(projectId)}`;
        } else if (marketplaceDesignId) {
          url += `&marketplaceDesignId=${encodeURIComponent(marketplaceDesignId)}`;
        }
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        return [];
      }
    },
    enabled: !!otherUserId,
    refetchInterval: 2000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const messageData: any = {
        receiverId: otherUserId,
        content,
      };
      
      if (projectId) {
        messageData.projectId = projectId;
        messageData.contextType = "project";
      } else if (marketplaceDesignId) {
        messageData.marketplaceDesignId = marketplaceDesignId;
        messageData.contextType = "marketplace_design";
      }
      
      await apiRequest("POST", "/api/messages", messageData);
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", projectId, marketplaceDesignId, otherUserId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    },
  });

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (otherUserId) {
      // Debounce the mark as read call to avoid too many requests
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current);
      }
      
      markReadTimeoutRef.current = setTimeout(async () => {
        try {
          let url = `/api/messages/mark-read/${otherUserId}`;
          if (projectId) {
            url += `?projectId=${encodeURIComponent(projectId)}`;
          } else if (marketplaceDesignId) {
            url += `?marketplaceDesignId=${encodeURIComponent(marketplaceDesignId)}`;
          }
          await apiRequest("PUT", url, {});
          // Invalidate conversations to remove unread badges
          queryClient.invalidateQueries({ queryKey: ["/api/my-conversations-full"] });
          queryClient.invalidateQueries({ queryKey: ["/api/my-conversations"] });
        } catch (error) {
          console.error("Failed to mark messages as read:", error);
        }
      }, 300); // Small delay to avoid multiple calls
    }

    return () => {
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current);
      }
    };
  }, [otherUserId, projectId, marketplaceDesignId, queryClient]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim()) {
      sendMutation.mutate(messageText);
    }
  };

  const otherUserInitials = (otherUser?.username || otherUser?.email)?.[0].toUpperCase() || "U";

  return (
    <Card className="flex flex-col h-[500px] border">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3">
        <Avatar>
          <AvatarImage src={otherUser?.profileImageUrl || undefined} />
          <AvatarFallback>{otherUserInitials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">
            {otherUser?.username || otherUser?.email}
          </p>
          <p className="text-xs text-muted-foreground">
            {otherUser?.userType === "maker" ? "Maker" : "Cliente"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No hay mensajes aún</p>
            <p className="text-sm">¡Inicia la conversación!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}
              data-testid={`message-bubble-${msg.id}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === currentUserId
                    ? "bg-blue-200 dark:bg-blue-800 text-blue-950 dark:text-blue-100"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-xs opacity-70">
                    {format(new Date(msg.createdAt), "HH:mm", { locale: es })}
                  </p>
                  {msg.senderId === currentUserId && (
                    <CheckCheck 
                      className="h-4 w-4 text-blue-950/40 dark:text-blue-100/40"
                      data-testid={`ticks-${msg.id}`}
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 flex gap-2">
        <Input
          placeholder="Escribe un mensaje..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          disabled={sendMutation.isPending}
          data-testid="input-message"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={sendMutation.isPending || !messageText.trim()}
          data-testid="button-send-message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
