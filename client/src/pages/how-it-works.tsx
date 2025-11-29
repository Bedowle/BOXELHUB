import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, MessageSquare, CheckCircle, Users } from "lucide-react";

export default function HowItWorks() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    const previousPath = localStorage.getItem('lastPath') || '/';
    setLocation(previousPath);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 max-w-7xl flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Cómo Funciona</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-4">El Marketplace P2P más Simple</h2>
          <p className="text-lg text-muted-foreground">
            VoxelHub conecta directamente a clientes que necesitan impresión 3D con makers que tienen impresoras. Sin intermediarios, sin comisiones, 100% transparencia.
          </p>
        </div>

        {/* PARA CLIENTES */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Para Clientes</h2>
          <div className="space-y-4">
            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      <Upload className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">1. Sube tu Proyecto</h3>
                    <p className="text-muted-foreground">
                      Carga tu archivo STL, especifica el material deseado, dimensiones, cantidad y presupuesto. Describe con claridad qué necesitas imprimir.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-secondary text-white">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">2. Recibe Ofertas de Makers</h3>
                    <p className="text-muted-foreground">
                      Makers verificados ven tu proyecto y envían ofertas con precio y tiempo de entrega. Compara múltiples opciones y elige la mejor.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-600 text-white">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">3. Negocia y Confirma</h3>
                    <p className="text-muted-foreground">
                      Chatea directamente con el maker, resuelve dudas, negocia detalles. Cuando llegues a un acuerdo, confirma la oferta.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-amber-600 text-white">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">4. Acuerdo Confirmado</h3>
                    <p className="text-muted-foreground">
                      Confirman el acuerdo en la plataforma y se coordinan directamente. El maker imprime tu proyecto. ¡Así de simple!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* PARA MAKERS */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Para Makers</h2>
          <div className="space-y-4">
            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                      <Upload className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">1. Configura tu Perfil</h3>
                    <p className="text-muted-foreground">
                      Describe tus impresoras, materiales disponibles, capacidades técnicas y tarifas. Los clientes ven tu perfil y reputación.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-secondary text-white">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">2. Explora Proyectos</h3>
                    <p className="text-muted-foreground">
                      Busca proyectos que coincidan con tus capacidades. Filtra por material, tamaño, complejidad y ubicación. Ve exactamente qué busca cada cliente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">3. Envía Ofertas</h3>
                    <p className="text-muted-foreground">
                      Proporciona tu precio competitivo y tiempo de entrega. Negocia directamente con el cliente a través del chat. Tú estableces las reglas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-600 text-white">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">4. Imprime y Gana</h3>
                    <p className="text-muted-foreground">
                      Si el cliente confirma, imprime el proyecto. Coordina directamente con el cliente sobre pagos y envío. Construye reputación y gana más proyectos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* VALORES CLAVE */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">¿Por Qué VoxelHub?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Sin Comisiones</h3>
              <p className="text-sm text-muted-foreground">
                El 100% de lo que negocias es tuyo. Ni un euro de comisión. Tú y el cliente establecen el precio justo.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Control Total</h3>
              <p className="text-sm text-muted-foreground">
                Como maker decides qué proyectos aceptas, qué cobras y cuándo entregas. Flexibilidad total.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Conexión Directa</h3>
              <p className="text-sm text-muted-foreground">
                Chat directo con clientes. Sin bots, sin demoras. Negocia en tiempo real y cierra acuerdos rápido.
              </p>
            </div>
          </div>
        </div>

        {/* PRÓXIMAS CARACTERÍSTICAS */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Próximamente: Pagos y Envíos Integrados</h2>
          <p className="text-muted-foreground mb-4">
            Estamos trabajando en integrar pagos seguros y gestión de envíos directamente en VoxelHub para hacer el proceso aún más simple.
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-1">💳 Pagos Integrados</p>
              <p className="text-muted-foreground">Procesa pagos de forma segura sin salir de la plataforma.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">📦 Envíos Coordinados</p>
              <p className="text-muted-foreground">Gestiona envíos directamente con seguimiento en tiempo real.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
