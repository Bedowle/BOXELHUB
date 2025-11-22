import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { UserTypeSelector } from "@/components/UserTypeSelector";
import AppHeader from "@/components/AppHeader";
import Logo from "@/components/Logo";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import ClientHome from "@/pages/client-home";
import MakerHome from "@/pages/maker-home";
import ProjectDetails from "@/pages/project-details";
import ChatPage from "@/pages/chat-page";

function Router() {
  const { user, isAuthenticated, isLoading, isClient, isMaker } = useAuth();
  
  // Connect to WebSocket for real-time notifications
  useWebSocket();

  return (
    <Switch>
      {/* Auth route (accessible to all) */}
      <Route path="/auth" component={AuthPage} />

      {isLoading ? (
        <Route path="/">
          {() => (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando...</p>
              </div>
            </div>
          )}
        </Route>
      ) : !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : !user?.userType ? (
        <Route path="/">
          {() => <UserTypeSelector />}
        </Route>
      ) : (
        <>
          {/* Client Routes */}
          {isClient && (
            <>
              <Route path="/" component={ClientHome} />
              <Route path="/project/:id" component={ProjectDetails} />
              <Route path="/chat/:userId" component={ChatPage} />
            </>
          )}
          
          {/* Maker Routes */}
          {isMaker && (
            <>
              <Route path="/" component={MakerHome} />
              <Route path="/project/:id" component={ProjectDetails} />
              <Route path="/chat/:userId" component={ChatPage} />
            </>
          )}
        </>
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <Logo />
      {isAuthenticated && !isLoading && <AppHeader />}
      <Router />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
