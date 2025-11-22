import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";

export default function AppHeader() {
  const [, setLocation] = useLocation();
  const { user, isClient, isMaker } = useAuth();

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

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {isClient ? "Cliente" : isMaker ? "Maker" : ""}
            </span>
            <span className="text-sm font-medium hidden sm:block">
              {user?.firstName || user?.email}
            </span>
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
