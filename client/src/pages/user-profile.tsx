import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

export default function UserProfilePage() {
  const [match, params] = useRoute("/user/:userId");
  const [, setLocation] = useLocation();
  const userId = params?.userId;

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${userId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!userId,
  });

  if (!match) return null;
  if (isLoading) return <div className="p-4">Cargando...</div>;
  if (error || !user) return <div className="p-4">Usuario no encontrado</div>;

  const userInitial = user.username?.[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/chats")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.username}</CardTitle>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.location && (
                <div>
                  <h3 className="font-semibold text-sm">Ubicación</h3>
                  <p className="text-sm text-muted-foreground">{user.location}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-sm">Tipo de usuario</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {user.userType === "client" ? "Cliente" : "Maker"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
