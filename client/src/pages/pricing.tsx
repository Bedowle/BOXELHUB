import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function Pricing() {
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
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Precios</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <section className="mb-12">
          <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            100% Gratis. Siempre.
          </h2>
          <p className="text-center text-lg font-semibold text-foreground">
            Sin comisiones. Sin sorpresas. Sin límites.
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
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">Gratis</p>
                <p className="text-sm text-muted-foreground mt-2">Únirse a la plataforma es completamente gratis</p>
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

        <Card className="mt-8 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-8 pb-8">
            <h3 className="text-xl font-bold mb-3">📦 Sistema de Envíos - En Desarrollo</h3>
            <p className="text-muted-foreground">
              Estamos trabajando en un sistema de envíos integrado que te permitirá coordinar entregas 
              directamente con tus clientes y rastrear paquetes en tiempo real.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-8 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
          <CardContent className="pt-8 pb-8">
            <h3 className="text-xl font-bold mb-3">🚀 Biblioteca de STL - En Desarrollo</h3>
            <p className="text-muted-foreground mb-4">
              Estamos trabajando en una nueva funcionalidad que te permitirá subir tus diseños STL 
              a una biblioteca pública y venderlos directamente a otros usuarios.
            </p>
            <div className="space-y-2 text-sm mb-4">
              <p><strong>Próximamente podrás:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Crear una tienda personal de diseños 3D</li>
                <li>Vender STL con precios fijos o mínimos</li>
                <li>Recibir pagos automáticos por cada venta</li>
                <li>Construir ingresos pasivos con tus modelos 3D</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
              <p className="text-sm text-foreground mb-2">
                <strong>💬 Tu opinión importa:</strong> Estamos definiendo la estructura de comisiones para esta sección. 
                Si tienes feedback o sugerencias sobre qué porcentaje debería ser, ¡no dudes en contactarnos! 
                Tu experiencia es fundamental para construir una plataforma justa para todos.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
