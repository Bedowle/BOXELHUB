import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Printer } from "lucide-react";

export function UserTypeSelector() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (userType: "client" | "maker") => {
      await apiRequest("PUT", "/api/user/type", { userType });
    },
    onSuccess: () => {
      toast({
        title: "¡Bienvenido a VoxelHub!",
        description: selectedType === "client" 
          ? "Ya puedes comenzar a subir tus proyectos" 
          : "Completa tu perfil de maker para comenzar a recibir proyectos",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar tu tipo de usuario",
        variant: "destructive",
      });
    },
  });

  const handleSelect = (type: "client" | "maker") => {
    setSelectedType(type);
    mutation.mutate(type);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">¡Bienvenido a VoxelHub!</h1>
          <p className="text-xl text-white/90">Selecciona cómo quieres usar la plataforma</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Client Option */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:scale-105 border-4 ${
              selectedType === 'client' ? 'border-primary shadow-2xl' : 'border-transparent'
            }`}
            onClick={() => !mutation.isPending && handleSelect('client')}
            data-testid="card-select-client"
          >
            <CardHeader className="text-center pb-4">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Soy Cliente</CardTitle>
              <CardDescription className="text-base">
                Necesito imprimir mis modelos 3D
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Sube hasta 10 proyectos STL simultáneos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Recibe ofertas competitivas de makers verificados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Compara precios, tiempos y capacidades</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Chat directo con el maker seleccionado</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Maker Option */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:scale-105 border-4 ${
              selectedType === 'maker' ? 'border-secondary shadow-2xl' : 'border-transparent'
            }`}
            onClick={() => !mutation.isPending && handleSelect('maker')}
            data-testid="card-select-maker"
          >
            <CardHeader className="text-center pb-4">
              <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Printer className="h-10 w-10 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Soy Maker</CardTitle>
              <CardDescription className="text-base">
                Tengo impresora 3D y quiero ofrecer mis servicios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Accede a proyectos activos de clientes reales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Envía hasta 2 ofertas simultáneas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Tú decides el precio y tiempo de entrega</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Construye tu reputación y gana clientes</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {mutation.isPending && (
          <div className="text-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Configurando tu cuenta...</p>
          </div>
        )}
      </div>
    </div>
  );
}
