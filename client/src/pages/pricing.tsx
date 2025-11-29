import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function Pricing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 max-w-7xl flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Precios</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-4">Comisión de VoxelHub</h2>
          <p className="text-center text-muted-foreground text-lg">
            Ofrecemos el mejor valor para clientes y makers
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover-elevate">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-2xl font-bold mb-4">Para Clientes</h3>
              <div className="mb-6">
                <p className="text-4xl font-bold text-primary">Gratis</p>
                <p className="text-sm text-muted-foreground mt-2">Sube proyectos sin costo</p>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Subir proyectos ilimitados</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Recibir múltiples ofertas</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Chat directo con makers</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Garantía de satisfacción</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-2xl font-bold mb-4">Para Makers</h3>
              <div className="mb-6">
                <p className="text-4xl font-bold text-primary">6.5%</p>
                <p className="text-sm text-muted-foreground mt-2">Comisión por proyecto ganado</p>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Acceso a proyectos constantes</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Establece tus propios precios</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Pagos seguros y verificados</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Construye tu reputación</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <h3 className="text-xl font-bold mb-3">¿Cómo funciona la comisión?</h3>
            <p className="text-muted-foreground">
              Los makers pagan una comisión de 6.5% sobre cada proyecto ganado. Esta comisión cubre:
              procesamiento de pagos, soporte técnico, garantía de satisfacción y protección del maker.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
