import { useState } from "react";
import { useLocation } from "wouter";
import ClientRegisterForm from "@/components/ClientRegisterForm";
import MakerRegisterForm from "@/components/MakerRegisterForm";
import LoginForm from "@/components/LoginForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [userType, setUserType] = useState<"client" | "maker" | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          {!userType ? (
            // User type selection
            <div className="p-8 text-center space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">VoxelHub</h1>
                <p className="text-muted-foreground">
                  Conecta con makers profesionales o comparte tus servicios
                </p>
              </div>

              <Tabs defaultValue="login" onValueChange={(v) => setMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                  <TabsTrigger value="register">Registrarse</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <LoginForm onSuccess={() => setLocation("/")} />
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={userType === "client" ? "default" : "outline"}
                      onClick={() => setUserType("client")}
                      size="lg"
                      data-testid="button-client-register"
                    >
                      Soy Cliente
                    </Button>
                    <Button
                      variant={userType === "maker" ? "default" : "outline"}
                      onClick={() => setUserType("maker")}
                      size="lg"
                      data-testid="button-maker-register"
                    >
                      Soy Maker
                    </Button>
                  </div>

                  {userType === "client" && (
                    <ClientRegisterForm onSuccess={() => setLocation("/")} />
                  )}
                  {userType === "maker" && (
                    <MakerRegisterForm onSuccess={() => setLocation("/")} />
                  )}
                </TabsContent>
              </Tabs>

              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                data-testid="button-back-to-landing"
              >
                Volver a inicio
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
