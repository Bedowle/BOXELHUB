import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [location, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState<boolean | null>(null);

  useEffect(() => {
    // Get token from multiple sources
    let tokenParam = null;

    // 1. Try sessionStorage first (set by App.tsx when URL has ?token=)
    tokenParam = sessionStorage.getItem("resetPasswordToken");
    if (tokenParam) {
      console.log("[ResetPassword] Token found in sessionStorage");
      sessionStorage.removeItem("resetPasswordToken"); // Clean up after reading
    }

    // 2. Fallback to URL search params
    if (!tokenParam) {
      const params = new URLSearchParams(window.location.search);
      tokenParam = params.get("token");
      if (tokenParam) {
        console.log("[ResetPassword] Token found in URL search");
      }
    }

    // 3. Fallback to hash params
    if (!tokenParam) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      tokenParam = hashParams.get("token");
      if (tokenParam) {
        console.log("[ResetPassword] Token found in URL hash");
      }
    }

    console.log("[ResetPassword] Final token:", tokenParam ? "✓ Found" : "✗ Not found");

    if (!tokenParam) {
      setIsExpired(true);
    } else {
      setToken(tokenParam);
      setIsExpired(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Recuperar Contraseña</h2>
            <p className="text-muted-foreground text-sm">
              Ingresa tu nueva contraseña
            </p>
          </div>

          {isExpired === null ? (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <TokenInputForm onTokenSubmit={(inputToken) => {
              setToken(inputToken);
              setIsExpired(false);
            }} onCancel={() => setLocation("/auth")} />
          )}
        </Card>
      </div>
    </div>
  );
}
