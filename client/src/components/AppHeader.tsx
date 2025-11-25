import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut, MessageCircle, Sparkles, Package, Briefcase } from "lucide-react";

export default function AppHeader() {
  const [, setLocation] = useLocation();
  const { user, isClient, isMaker } = useAuth();

  const { data: conversations } = useQuery<Array<{ userId: string; unreadCount: number }>>({
    queryKey: ["/api/my-conversations-full"],
    enabled: !!user,
  });

  const { data: totalUnreadBids } = useQuery<{ totalUnread: number }>({
    queryKey: ["/api/projects/total-unread-bids"],
    enabled: !!user && isClient,
  });

  const totalUnread = conversations?.reduce((sum, conv) => sum + conv.unreadCount, 0) || 0;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between py-4">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            data-testid="button-logo"
          >
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                VoxelHub
              </span>
              <div className="w-5 h-5 rounded-sm bg-accent flex items-center justify-center text-white text-xs font-bold">
                ◼
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Marketplace button for both clients and makers */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/marketplace")}
              data-testid="button-marketplace"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Explorar Diseños</span>
            </Button>
            
            {isClient && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/client/projects-active")}
                className="relative"
                data-testid="button-my-projects"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Mis Proyectos</span>
                {totalUnreadBids && totalUnreadBids.totalUnread > 0 && (
                  <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                    {totalUnreadBids.totalUnread > 9 ? "9+" : totalUnreadBids.totalUnread}
                  </div>
                )}
              </Button>
            )}
            
            {isMaker && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/maker/marketplace")}
                data-testid="button-my-designs"
              >
                <Package className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Mi Tienda</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/chats")}
              className="relative"
              data-testid="button-chats"
            >
              <MessageCircle className="h-5 w-5" />
              {totalUnread > 0 && (
                <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </div>
              )}
            </Button>

            <span className="text-sm text-muted-foreground hidden sm:block">
              {isClient ? "Cliente" : isMaker ? "Maker" : ""}
            </span>
            <button
              onClick={() => setLocation(`/user/${user?.id}`)}
              className="text-sm font-medium hidden sm:block hover:text-primary transition-colors cursor-pointer"
              data-testid="button-profile-link"
            >
              {user?.firstName || user?.email}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = "/api/logout";
              }}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
