import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
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
          <h1 className="text-2xl font-bold">Política de Privacidad</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">Cumplimiento GDPR</h2>
            <p>
              VoxelHub opera conforme al Reglamento General de Protección de Datos (RGPD) (UE) 2016/679 y cumple con toda la normativa europea de protección de datos personales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">Datos que Recopilamos</h2>
            <p>
              Recopilamos información personal: nombre, email, ubicación, archivos STL, datos de perfil y datos de transacciones.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">Cómo Usamos tus Datos</h2>
            <p>
              Usamos tu información para facilitar transacciones, comunicaciones, notificaciones, mejorar nuestros servicios y cumplir con obligaciones legales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">Seguridad</h2>
            <p>
              Tus datos están encriptados y almacenados en servidores seguros en la Unión Europea. Implementamos medidas de protección conforme a los estándares europeos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">Tus Derechos</h2>
            <p>
              Conforme al RGPD, tienes derecho a acceder, rectificar, eliminar tus datos, portabilidad y oposición al tratamiento. Contáctanos en support@voxelhub.com para ejercer cualquiera de estos derechos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">Compartición de Datos</h2>
            <p>
              No compartimos tus datos con terceros sin consentimiento, excepto proveedores de pago (Stripe, PayPal) y autoridades legales cuando sea requerido.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">Reclamaciones</h2>
            <p>
              Si tienes reclamaciones sobre protección de datos, puedes contactar con la Autoridad de Protección de Datos de tu país.
            </p>
          </section>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8">
            <p className="text-sm">
              <strong>Contacto:</strong> support@voxelhub.com
            </p>
            <p className="text-sm mt-2">
              Última actualización: Noviembre 2024
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
