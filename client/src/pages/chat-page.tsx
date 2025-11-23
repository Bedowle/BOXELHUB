import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage.tsx";
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
  const { language } = useLanguage();

  const otherUserId = params?.userId;

  const { data: otherUser } = useQuery<User>({
    queryKey: ["/api/user", otherUserId],
    enabled: !!otherUserId && !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: language === 'es' ? "No autorizado" : "Unauthorized",
        description: language === 'es' ? "Iniciando sesión..." : "Signing in...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast, language]);

  if (!match || authLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              language === 'es' ? 'Volver' : 'Back'}
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user.firstName || user.email}
              </span>
              <Button variant="outline" asChild size="sm">
                <a href="/api/logout">language === 'es' ? 'Cerrar Sesión' : 'Logout'}</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {otherUser && user ? (
          <ChatInterface
            otherUserId={otherUserId!}
            otherUser={otherUser}
            currentUserId={user.id}
          />
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">language === 'es' ? 'Cargando chat...' : 'Loading chat...'}</p>
          </div>
        )}
      </main>
    </div>
  );
}
