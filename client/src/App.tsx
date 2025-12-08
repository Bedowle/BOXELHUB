import { useEffect } from "react";
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
import MakerProfile from "@/pages/maker-profile";
import MakerReviews from "@/pages/maker-reviews";
import ProjectDetails from "@/pages/project-details";
import MakerProjectDetails from "@/pages/maker-project-details";
import ClientProjectsActive from "@/pages/client-projects-active";
import ClientProjectsCompleted from "@/pages/client-projects-completed";
import ClientBidsList from "@/pages/client-bids-list";
import MakerBidsList from "@/pages/maker-bids-list";
import MakerWonProjects from "@/pages/maker-won-projects";
import MakerCompletedProjects from "@/pages/maker-completed-projects";
import ExploreProjects from "@/pages/explore-projects";
import ChatPage from "@/pages/chat-page";
import ChatsPage from "@/pages/chats";
import ChatsSplitPage from "@/pages/chats-split";
import VerifyEmailPage from "@/pages/verify-email";
import ResetPasswordPage from "@/pages/reset-password";
import WhatIsSTLPage from "@/pages/what-is-stl";
import About from "@/pages/about";
import Pricing from "@/pages/pricing";
import HowItWorks from "@/pages/how-it-works";
import Help from "@/pages/help";
import Contact from "@/pages/contact";
import FAQ from "@/pages/faq";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
// MARKETPLACE FEATURES - HIDDEN (uncomment when needed)
// import MakerMarketplaceUpload from "@/pages/maker-marketplace-upload";
// import MarketplaceDesignChatsPage from "@/pages/marketplace-design-chats";
// import ClientMarketplace from "@/pages/client-marketplace";
// import MarketplaceDesignDetailPage from "@/pages/marketplace-design-detail";
// import MakerBalance from "@/pages/maker-balance";
import UserProfilePage from "@/pages/user-profile";

function Router() {
  const { user, isAuthenticated, isLoading, isClient, isMaker } = useAuth();
  
  // Connect to WebSocket for real-time notifications
  useWebSocket();

  return (
    <Switch>
      {/* Verify email route (accessible to all) */}
      <Route path="/verify" component={VerifyEmailPage} />

      {/* Reset password route (accessible to all) */}
      <Route path="/reset-password/:token" component={ResetPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />

      {/* What is STL route (accessible to all) */}
      <Route path="/what-is-stl" component={WhatIsSTLPage} />

      {/* Footer links (accessible to all) */}
      <Route path="/about" component={About} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/help" component={Help} />
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />

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
          {/* Shared Routes */}
          <Route path="/chats" component={ChatsSplitPage} />
          <Route path="/chats-old" component={ChatsPage} />
          <Route path="/user/:userId" component={UserProfilePage} />
          <Route path="/user/:userId/reviews" component={MakerReviews} />
          {/* MARKETPLACE HIDDEN */}
          {/* <Route path="/marketplace" component={ClientMarketplace} /> */}
          {/* <Route path="/marketplace-design/:designId" component={MarketplaceDesignDetailPage} /> */}

          {/* Client Routes */}
          {isClient && (
            <>
              <Route path="/" component={ClientHome} />
              <Route path="/client" component={ClientHome} />
              <Route path="/client/projects-active" component={ClientProjectsActive} />
              <Route path="/client/projects-completed" component={ClientProjectsCompleted} />
              <Route path="/client/bids" component={ClientBidsList} />
              <Route path="/project/:id" component={ProjectDetails} />
              <Route path="/chat/:userId" component={ChatPage} />
            </>
          )}
          
          {/* Maker Routes */}
          {isMaker && (
            <>
              <Route path="/" component={MakerHome} />
              <Route path="/maker" component={MakerHome} />
              <Route path="/maker/profile" component={MakerProfile} />
              <Route path="/maker/reviews" component={MakerReviews} />
              {/* MARKETPLACE HIDDEN - Balance route disabled */}
              {/* <Route path="/maker/balance" component={MakerBalance} /> */}
              <Route path="/maker/explore" component={ExploreProjects} />
              <Route path="/maker/bids" component={MakerBidsList} />
              <Route path="/maker/won-projects" component={MakerWonProjects} />
              <Route path="/maker/completed-projects" component={MakerCompletedProjects} />
              {/* MARKETPLACE HIDDEN */}
              {/* <Route path="/maker/marketplace" component={MakerMarketplaceUpload} /> */}
              {/* <Route path="/marketplace-design-chats/:designId" component={MarketplaceDesignChatsPage} /> */}
              <Route path="/maker/project/:id" component={MakerProjectDetails} />
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

  // Handle password reset token from URL (for email links) - do this early
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("token");
    const isResetPasswordPage = window.location.pathname === "/reset-password";
    
    if (resetToken && isResetPasswordPage) {
      // Save token to sessionStorage for the reset-password page
      sessionStorage.setItem("resetPasswordToken", resetToken);
      console.log("[AppContent] Stored reset password token in sessionStorage");
    }
  }, []);

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
