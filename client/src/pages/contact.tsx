import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";

export default function Contact() {
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
          <h1 className="text-2xl font-bold">Contacto</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">Email</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Envíanos tus consultas, sugerencias o reportes
              </p>
              <a href="mailto:support@voxelhub.com" className="text-primary hover:underline font-semibold">
                support@voxelhub.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">WhatsApp</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Contacta con nosotros directamente
              </p>
              <p className="text-amber-600 dark:text-amber-400 font-semibold">
                Próximamente
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <h3 className="text-xl font-bold mb-3">Redes Sociales</h3>
            <p className="text-amber-600 dark:text-amber-400 font-semibold">
              Próximamente
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
