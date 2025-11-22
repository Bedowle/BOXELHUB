import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function AppHeader() {
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => setLocation("/")}
            className="text-xl font-bold text-orange-500 hover:opacity-80 transition-opacity"
            data-testid="button-logo"
          >
            VoxelHub ◼
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
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </header>
  );
}
