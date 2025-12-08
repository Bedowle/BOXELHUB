import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, HelpCircle } from "lucide-react";

export default function Help() {
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
          <h1 className="text-2xl font-bold">Centro de Ayuda</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Temas Frecuentes</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">¿Cómo subo un proyecto?</h3>
                <p className="text-sm text-muted-foreground">
                  Accede a tu panel de cliente, haz clic en "Crear Proyecto", sube tu archivo STL,
                  especifica los detalles y recibirás ofertas de makers profesionales.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">¿Es segura la plataforma?</h3>
                <p className="text-sm text-muted-foreground">
                  Sí, VoxelHub cuenta con múltiples sistemas de seguridad, autenticación verificada
                  y protección de datos.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">¿Cómo reciben pago los makers?</h3>
                <p className="text-sm text-muted-foreground mb-3">Clientes y makers se ponen de acuerdo en el precio a través del chat. Una vez que quedan conformes, se contactan directamente para coordinar los detalles.</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                  <strong>En desarrollo:</strong> Estamos trabajando en un sistema de envíos integrado 
                  y garantía de pagos a distancia para mayor seguridad y confianza.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
