import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/ChatInterface";
import { ArrowLeft } from "lucide-react";
import type { User } from "@shared/schema";

export default function ChatPage() {
  const [match, params] = useRoute("/chat/:userId");
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const otherUserId = params?.userId;
  
  // Get query parameters
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const marketplaceDesignId = searchParams.get('marketplaceDesignId') || undefined;
  const projectId = searchParams.get('projectId') || undefined;

  const { data: otherUser } = useQuery<User>({
    queryKey: ["/api/user", otherUserId],
    enabled: !!otherUserId && !!user,
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

  if (!match || authLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-4 sticky top-0 z-50 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 dark:from-primary/20 dark:via-slate-900/50 dark:to-secondary/20 backdrop-blur-md border-primary/20">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => window.history.back()}
          className="hover-elevate"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {otherUser && user ? (
          <ChatInterface
            otherUserId={otherUserId!}
            otherUser={otherUser}
            currentUserId={user.id}
            projectId={projectId}
            marketplaceDesignId={marketplaceDesignId}
          />
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando chat...</p>
          </div>
        )}
      </main>
    </div>
  );
}
