import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function AppHeader() {
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setLocation("/")}
          className="text-xl font-bold hover:bg-transparent"
          data-testid="button-logo"
        >
          <span className="text-orange-500">VoxelHub</span>
          <span className="ml-1 text-orange-500">◼</span>
        </Button>

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
    </header>
  );
}
