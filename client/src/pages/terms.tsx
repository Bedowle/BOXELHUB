import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
          <h1 className="text-2xl font-bold">Términos de Servicio</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Términos Generales</h2>
            <p>
              Al usar VoxelHub, aceptas estos términos de servicio. Si no estás de acuerdo con alguno
              de los términos, por favor no uses nuestra plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. Responsabilidades del Usuario</h2>
            <p>
              Como usuario de VoxelHub, eres responsable de:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Mantener la confidencialidad de tu cuenta</li>
              <li>Proporcionar información precisa</li>
              <li>Respetar los derechos de propiedad intelectual</li>
              <li>Cumplir con todas las leyes aplicables</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. Derechos de Propiedad Intelectual</h2>
            <p>
              Los usuarios retienen todos los derechos sobre sus diseños STL. VoxelHub no reclama propiedad
              sobre ningún contenido subido por los usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Limitación de Responsabilidad</h2>
            <p>
              VoxelHub actúa como intermediaria. No somos responsables de daños directos, indirectos o
              consecuentes derivados del uso de nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Prohibiciones</h2>
            <p>
              No está permitido:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Usar la plataforma para actividades ilegales</li>
              <li>Acosar u ofender a otros usuarios</li>
              <li>Manipular o hackear la plataforma</li>
              <li>Violar derechos de propiedad intelectual</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Cambios en los Términos</h2>
            <p>
              VoxelHub se reserva el derecho de modificar estos términos en cualquier momento.
              Los cambios serán notificados por email.
            </p>
          </section>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8">
            <p className="text-sm">
              Última actualización: Noviembre 2025
            </p>
            <p className="text-sm mt-2">
              Si tienes preguntas sobre estos términos, contacta a support@voxelhub.com
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
