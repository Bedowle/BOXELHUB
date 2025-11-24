import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Message, User } from "@shared/schema";

interface ChatWindowProps {
  otherUserId: string;
  otherUser: User | undefined;
  currentUserId: string;
  projectId?: string;
  marketplaceDesignId?: string;
  designTitle?: string;
  designPrice?: number;
  project?: any;
  design?: any;
}

export function ChatWindow({
  otherUserId,
  otherUser,
  currentUserId,
  projectId,
  marketplaceDesignId,
  designTitle,
  designPrice,
  project,
  design,
}: ChatWindowProps) {
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
      } else {
        // This should never happen if ChatWindow is used correctly
        throw new Error("Message must have either projectId or marketplaceDesignId");
      }

      await apiRequest("POST", "/api/messages", messageData);
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({
        queryKey: ["/api/messages", projectId, marketplaceDesignId, otherUserId],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    },
  });

  // Mark messages as read
  useEffect(() => {
    if (otherUserId) {
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
          queryClient.invalidateQueries({
            queryKey: ["/api/my-conversations-full"],
          });
          queryClient.invalidateQueries({ queryKey: ["/api/my-conversations"] });
        } catch (error) {
          console.error("Failed to mark messages as read:", error);
        }
      }, 300);
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

  const otherUserInitials = otherUser?.username?.[0].toUpperCase() || "U";

  // Filter messages to only include those belonging to this conversation context
  const filteredMessages = messages.filter(msg => {
    if (projectId) {
      // Project context: only show messages where projectId matches and designId is null
      return msg.projectId === projectId && msg.marketplaceDesignId === null;
    } else if (marketplaceDesignId) {
      // Design context: only show messages where designId matches and projectId is null
      return msg.marketplaceDesignId === marketplaceDesignId && msg.projectId === null;
    }
    return false;
  });

  // Group messages by date
  const groupedMessages = filteredMessages.reduce(
    (groups, msg) => {
      const date = format(new Date(msg.createdAt), "d 'de' MMMM", {
        locale: es,
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
      return groups;
    },
    {} as Record<string, Message[]>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between sticky top-0 z-20 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Product/Project Context */}
          {project && (
            <Avatar className="flex-shrink-0">
              <AvatarImage src={project.stlImageUrl} />
              <AvatarFallback className="bg-muted text-xs">
                {project.name?.[0]?.toUpperCase() || "P"}
              </AvatarFallback>
            </Avatar>
          )}
          {design && (
            <Avatar className="flex-shrink-0">
              <AvatarImage src={design.imageUrl} />
              <AvatarFallback className="bg-muted text-xs">
                {design.title?.[0]?.toUpperCase() || "D"}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {otherUser?.username || otherUser?.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {project?.name || design?.title || "Sin contexto"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <Info className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Avatar className="w-16 h-16 mx-auto mb-4">
                <AvatarImage src={otherUser?.profileImageUrl || undefined} />
                <AvatarFallback className="text-xl">
                  {otherUserInitials}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold mb-2">
                Inicia una conversación con {otherUser?.username}
              </p>
              <p className="text-sm text-muted-foreground">
                Sé el primero en escribir
              </p>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="flex items-center gap-2 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-2">
                  {msgs.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderId === currentUserId
                          ? "justify-end"
                          : "justify-start"
                      }`}
                      data-testid={`message-bubble-${msg.id}`}
                    >
                      <div className="flex items-end gap-2 max-w-sm">
                        {msg.senderId !== currentUserId && (
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={otherUser?.profileImageUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {otherUserInitials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl break-words ${
                            msg.senderId === currentUserId
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-muted-foreground rounded-bl-none"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {format(new Date(msg.createdAt), "HH:mm", {
                              locale: es,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 sticky bottom-0 bg-background/95 backdrop-blur flex gap-2">
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
    </div>
  );
}
