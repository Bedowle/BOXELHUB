import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Upload, Users, CheckCircle, Star, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({ verifiedMakers: 0, completedProjects: 0, averageRating: 0 });

  useEffect(() => {
    localStorage.setItem('lastPath', '/');
    // Fetch stats
    apiRequest("GET", "/api/stats")
      .then(data => setStats(data))
      .catch(err => console.error("Error fetching stats:", err));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-800 dark:via-blue-700 dark:to-indigo-800 py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent"></div>
        
        {/* Login Button - Top Right */}
        <div className="absolute top-6 right-6 z-20">
          <Button 
            variant="outline"
            className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            onClick={() => setLocation("/auth")}
            data-testid="button-login-landing"
          >
            Iniciar Sesión
          </Button>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Impresión 3D a tu medida
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
              Conecta con makers profesionales. Sube tu modelo STL y recibe ofertas competitivas en tiempo real
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                onClick={() => setLocation("/auth?type=client")}
                data-testid="button-client-cta"
              >
                Necesito Impresión
              </Button>
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90"
                onClick={() => setLocation("/auth?type=maker")}
                data-testid="button-maker-cta"
              >
                Soy Maker
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold text-center mb-4">¿Cómo funciona?</h2>
          <p className="text-center text-muted-foreground mb-16 text-lg max-w-2xl mx-auto">
            Tres simples pasos para conectar con los mejores makers
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  1. Sube tu{" "}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setLocation("/what-is-stl")}
                        className="text-primary hover:text-primary/80 transition underline cursor-pointer"
                        data-testid="link-what-is-stl"
                      >
                        STL
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>¿Qué es un STL?</p>
                    </TooltipContent>
                  </Tooltip>
                </h3>
                <p className="text-muted-foreground mb-4">
                  Sube tu archivo STL con las especificaciones y material requerido
                </p>
                <div className="flex flex-row justify-center gap-6">
                  <a 
                    href="https://www.thingiverse.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary/80 transition"
                    data-testid="link-thingiverse"
                  >
                    Explora STLs en Thingiverse
                  </a>
                  <a 
                    href="https://cults3d.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary/80 transition"
                    data-testid="link-cults3d"
                  >
                    Explora STLs en Cults3D
                  </a>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Recibe Ofertas</h3>
                <p className="text-muted-foreground">
                  Makers profesionales envían ofertas competitivas en tiempo real
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Elige y Confirma</h3>
                <p className="text-muted-foreground">
                  Selecciona la mejor oferta, chatea con el maker y confirma
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Printer className="h-6 w-6 text-primary" />
                <p className="text-4xl font-bold text-primary">{stats.verifiedMakers > 0 ? stats.verifiedMakers + '+' : '0'}</p>
              </div>
              <p className="text-muted-foreground text-lg">Makers Verificados</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-6 w-6 text-secondary" />
                <p className="text-4xl font-bold text-secondary">{stats.completedProjects > 0 ? stats.completedProjects + '+' : '0'}</p>
              </div>
              <p className="text-muted-foreground text-lg">Proyectos Completados</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-6 w-6 text-yellow-500" />
                <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-500">{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0'}</p>
              </div>
              <p className="text-muted-foreground text-lg">Valoración Promedio</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Makers Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">¿Eres Maker?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Únete a nuestra comunidad de makers y monetiza tu impresora 3D
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6 pb-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Proyectos Constantes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Accede a un flujo continuo de proyectos de clientes verificados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 pb-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Tú Decides el Precio
                </h3>
                <p className="text-sm text-muted-foreground">
                  Envía ofertas competitivas y negocia directamente con los clientes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 pb-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Pagos Seguros
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sistema de pagos protegido con garantía para ambas partes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 pb-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Construye Reputación
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sistema de valoraciones para destacar tu calidad y profesionalismo
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center">
            <Button 
              size="lg" 
              className="px-8" 
              onClick={() => setLocation("/auth?type=maker")}
              data-testid="button-maker-register"
            >
              Registrarme como Maker
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Printer className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">VoxelHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Marketplace P2P de impresión 3D profesional
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setLocation("/about")} className="hover:text-foreground transition cursor-pointer">Acerca de</button></li>
                <li><button onClick={() => setLocation("/how-it-works")} className="hover:text-foreground transition cursor-pointer">Cómo Funciona</button></li>
                <li><button onClick={() => setLocation("/pricing")} className="hover:text-foreground transition cursor-pointer">Precios</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setLocation("/contact")} className="hover:text-foreground transition cursor-pointer">Contacto</button></li>
                <li><button onClick={() => setLocation("/faq")} className="hover:text-foreground transition cursor-pointer">FAQ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setLocation("/privacy")} className="hover:text-foreground transition cursor-pointer">Privacidad</button></li>
                <li><button onClick={() => setLocation("/terms")} className="hover:text-foreground transition cursor-pointer">Términos</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 VoxelHub. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
