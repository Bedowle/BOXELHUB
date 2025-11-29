import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Printer } from "lucide-react";

export default function About() {
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
          <h1 className="text-2xl font-bold">Acerca de VoxelHub</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          <section>
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Printer className="h-8 w-8 text-primary" />
              Nuestra Misión
            </h2>
            <p className="text-lg text-muted-foreground">
              VoxelHub conecta clientes que necesitan servicios de impresión 3D con makers profesionales.
              Creamos una plataforma transparente, segura y eficiente donde ambas partes pueden colaborar
              en proyectos innovadores.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Nuestra Visión</h2>
            <p className="text-lg text-muted-foreground">
              Ser el marketplace líder de impresión 3D en América Latina, fomentando la innovación y
              conectando a profesionales de todo el mundo con oportunidades reales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">¿Por Qué VoxelHub?</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Seguridad garantizada</strong> - Protección para clientes y makers</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Precios competitivos</strong> - Sistema de ofertas en tiempo real</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Comunidad verificada</strong> - Makers profesionales y confiables</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Soporte 24/7</strong> - Equipo dedicado a ayudarte</span>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
