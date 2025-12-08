import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function FAQ() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    const previousPath = localStorage.getItem('lastPath') || '/';
    setLocation(previousPath);
  };

  const faqs = [
    {
      q: "¿Qué es VoxelHub?",
      a: "VoxelHub es un marketplace P2P que conecta clientes que necesitan servicios de impresión 3D con makers profesionales en todo el mundo.",
    },
    {
      q: "¿Cuánto cuesta usar VoxelHub?",
      a: "Para clientes es completamente gratis. Los makers pagan una comisión de 6.5% sobre cada proyecto ganado.",
    },
    {
      q: "¿Qué es un archivo STL?",
      a: "Un STL es un formato de archivo de modelo 3D que contiene la geometría necesaria para imprimir un objeto. Puedes descargar modelos de plataformas como Thingiverse o Cults3D.",
    },
    {
      q: "¿Cómo sé que los makers son confiables?",
      a: "Todos los makers en VoxelHub están verificados y tienen un sistema de calificaciones basado en proyectos completados. Puedes revisar sus historiales y reseñas.",
    },
    {
      q: "¿Es seguro compartir mis archivos STL?",
      a: "Sí, VoxelHub cuenta con múltiples capas de seguridad. Los archivos se almacenan en servidores seguros y solo tienen acceso los makers que cotizan en tu proyecto.",
    },
    {
      q: "¿Cómo funciona el pago?",
      a: "VoxelHub retiene los fondos hasta que el proyecto esté completado. Una vez que confirmes la entrega, el maker recibe el pago automáticamente.",
    },
    {
      q: "¿Puedo hablar con el maker antes de aceptar su oferta?",
      a: "Sí, puedes usar el chat integrado en VoxelHub para comunicarte directamente con los makers y discutir detalles del proyecto.",
    },
    {
      q: "¿Qué pasa si no estoy satisfecho con el resultado?",
      a: "VoxelHub ofrece protección al comprador. Si hay problemas, puedes reportarlos y nuestro equipo trabajará para resolverlos.",
    },
  ];

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
          <h1 className="text-2xl font-bold">Preguntas Frecuentes</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <section className="mb-8">
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
              <span className="text-primary">📱</span>
              <span><strong>WhatsApp:</strong> +34 XXX XXX XXX</span>
            </li>
          </ul>
        </section>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details key={idx} className="border rounded-lg p-4 hover:bg-muted/50 transition">
              <summary className="font-semibold cursor-pointer hover:text-primary">
                {faq.q}
              </summary>
              <p className="text-muted-foreground mt-3">{faq.a}</p>
            </details>
          ))}
        </div>
      </main>
    </div>
  );
}
