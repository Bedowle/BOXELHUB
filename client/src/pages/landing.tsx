import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-6xl font-bold text-white mb-6 tracking-tight">
            VoxelHub
          </h1>
          <p className="text-2xl text-white/80 mb-4">
            The P2P Marketplace for 3D Printing
          </p>
          <p className="text-lg text-white/60 mb-12">
            Connect with makers, get competitive bids, and bring your ideas to life
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              onClick={() => setLocation("/auth")}
              data-testid="button-login-landing"
            >
              Sign In
            </Button>
            <Button
              className="bg-white text-primary hover:bg-white/90"
              onClick={() => setLocation("/auth?type=client")}
              data-testid="button-register-client-landing"
            >
              Register as Client
            </Button>
            <Button
              className="bg-secondary text-white hover:bg-secondary/90"
              onClick={() => setLocation("/auth?type=maker")}
              data-testid="button-register-maker-landing"
            >
              Register as Maker
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
