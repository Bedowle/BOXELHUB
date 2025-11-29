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
            <h2 className="text-2xl font-bold mb-4">¿Necesitas Ayuda?</h2>
            <p className="text-muted-foreground mb-6">
              Estamos aquí para asistirte. Puedes contactarnos a través de:
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary">📧</span>
                <span><strong>Email:</strong> support@voxelhub.com</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">💬</span>
                <span><strong>Chat en vivo:</strong> Disponible 24/7</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">📱</span>
                <span><strong>WhatsApp:</strong> +34 XXX XXX XXX</span>
              </li>
            </ul>
          </section>

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
                  y protección de datos. Todos los makers están verificados.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">¿Cómo reciben pago los makers?</h3>
                <p className="text-sm text-muted-foreground">
                  Los makers pueden recibir pagos a través de Stripe, PayPal o transferencia bancaria.
                  Los fondos se procesan automáticamente una vez confirmada la entrega.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
