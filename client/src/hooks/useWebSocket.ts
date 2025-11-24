import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function useWebSocket() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const ws = new WebSocket(`${protocol}//${host}/ws`);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        
        // Register user for notifications
        ws.send(JSON.stringify({
          type: "register",
          userId: user.id,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case "new_bid":
              toast({
                title: "Nueva oferta recibida",
                description: "Un maker ha enviado una oferta para tu proyecto",
              });
              queryClient.invalidateQueries({ queryKey: ["/api/projects/my-projects"] });
              queryClient.invalidateQueries({ queryKey: ["/api/projects/stats"] });
              if (data.projectId) {
                queryClient.invalidateQueries({ queryKey: ["/api/projects", data.projectId, "bids"] });
              }
              break;
              
            case "bid_accepted":
              toast({
                title: "¡Oferta aceptada!",
                description: "Tu oferta ha sido aceptada. El cliente se pondrá en contacto contigo.",
              });
              queryClient.invalidateQueries({ queryKey: ["/api/projects/available"] });
              queryClient.invalidateQueries({ queryKey: ["/api/bids/my-bids"] });
              queryClient.invalidateQueries({ queryKey: ["/api/bids/stats"] });
              if (data.projectId) {
                queryClient.invalidateQueries({ queryKey: ["/api/projects", data.projectId] });
                queryClient.invalidateQueries({ queryKey: ["/api/projects", data.projectId, "bids"] });
                queryClient.invalidateQueries({ queryKey: ["/api/projects", data.projectId, "my-bid"] });
              }
              break;
              
            case "bid_rejected":
              toast({
                title: "Oferta rechazada",
                description: "El cliente ha seleccionado otra oferta",
                variant: "destructive",
              });
              queryClient.invalidateQueries({ queryKey: ["/api/projects/available"] });
              queryClient.invalidateQueries({ queryKey: ["/api/bids/my-bids"] });
              queryClient.invalidateQueries({ queryKey: ["/api/bids/stats"] });
              if (data.projectId) {
                queryClient.invalidateQueries({ queryKey: ["/api/projects", data.projectId, "bids"] });
                queryClient.invalidateQueries({ queryKey: ["/api/projects", data.projectId, "my-bid"] });
              }
              break;

            case "delivery_confirmed":
              toast({
                title: "Entrega confirmada",
                description: `${data.clientName} ha confirmado la recepción de "${data.projectName}". Puedes calificar desde tus proyectos ganados.`,
              });
              queryClient.invalidateQueries({ queryKey: ["/api/bids/my-bids"] });
              queryClient.invalidateQueries({ queryKey: ["/api/bids/stats"] });
              queryClient.invalidateQueries({ queryKey: ["/api/projects/my-bids"] });
              queryClient.invalidateQueries({ queryKey: ["/api/maker/delivery-statuses"] });
              if (data.projectId) {
                queryClient.invalidateQueries({ queryKey: ["/api/projects", data.projectId, "bids"] });
                queryClient.invalidateQueries({ queryKey: ["/api/projects", data.projectId] });
                queryClient.invalidateQueries({ queryKey: ["/api/projects", data.projectId, "check-rating-by-maker"] });
              }
              break;
              
            case "new_message":
              toast({
                title: "Nuevo mensaje",
                description: "Has recibido un nuevo mensaje",
              });
              // Invalidate specific conversation by context
              if (data.contextType === "project" && data.projectId) {
                queryClient.invalidateQueries({
                  queryKey: ["/api/messages", data.projectId, undefined, data.senderId],
                });
              } else if (data.contextType === "marketplace_design" && data.marketplaceDesignId) {
                queryClient.invalidateQueries({
                  queryKey: ["/api/messages", undefined, data.marketplaceDesignId, data.senderId],
                });
              }
              queryClient.invalidateQueries({ queryKey: ["/api/my-conversations-full"] });
              break;
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect WebSocket...");
          connect();
        }, 5000);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, user, toast, queryClient]);

  return {
    isConnected,
    send: (message: any) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      }
    },
  };
}
