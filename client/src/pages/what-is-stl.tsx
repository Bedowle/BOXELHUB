import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Package, Grid3X3, Zap, Lock } from "lucide-react";

export default function WhatIsSTL() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white transition mb-6"
            data-testid="button-back-from-stl"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a inicio
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">¿Qué es un STL?</h1>
          <p className="text-xl text-white/90">
            Descubre el formato que revoluciona la impresión 3D
          </p>
        </div>
      </div>
      {/* Main Content */}
      <div className="container mx-auto max-w-4xl py-16 px-4">
        {/* Visual Explanation */}
        <Card className="border-2 mb-12 hover-elevate">
          <CardContent className="pt-12 pb-12">
            <div className="flex items-center justify-center gap-8 flex-col md:flex-row">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Package className="h-16 w-16 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-4">STL = Tu Modelo en 3D</h2>
                <p className="text-lg text-muted-foreground mb-4">
                  STL significa <strong>"Stereolithography"</strong> (estereolitografía). Es simplemente un archivo que contiene las instrucciones digitales de tu modelo 3D: forma, tamaño, detalles y geometría.
                </p>
                <p className="text-muted-foreground">
                  Piénsalo así: si un PDF es el formato estándar para documentos, STL es el formato estándar para modelos 3D. Es el idioma que hablan las impresoras 3D.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works - Flow Diagram */}
        <div className="mb-12" style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transform: 'rotate(-90deg)', 
          transformOrigin: 'center',
          width: '70vh',
          height: 'auto',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{
            transform: 'rotate(90deg)',
            transformOrigin: 'center',
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
          }}>
            <h2 className="text-xl font-bold mb-3 text-center">¿Cómo funciona?</h2>
            
            {/* Step 1 - Two Initial Branches */}
            <div className="grid md:grid-cols-2 gap-2 mb-2">
              {/* Left Branch - Design Path */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="bg-primary/10 w-9 h-9 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-base font-semibold mb-1 text-center">Diseñas</h3>
                  <p className="text-xs text-muted-foreground text-center">
                    Crea tu diseño con software 3D
                  </p>
                </CardContent>
              </Card>

              {/* Right Branch - Download Path */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="bg-secondary/10 w-9 h-9 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-sm font-bold text-secondary">1</span>
                  </div>
                  <h3 className="text-base font-semibold mb-1 text-center">Descargas</h3>
                  <p className="text-xs text-muted-foreground text-center">
                    Descarga modelos listos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Connector Lines - Straight down */}
            <div className="grid md:grid-cols-2 gap-2 mb-2">
              <div className="flex justify-center">
                <div className="w-1 h-4 bg-gradient-to-b from-primary to-transparent"></div>
              </div>
              <div className="flex justify-center">
                <div className="w-1 h-4 bg-gradient-to-b from-secondary to-transparent"></div>
              </div>
            </div>

            {/* Step 2 - Two Branches */}
            <div className="grid md:grid-cols-2 gap-2 mb-2">
              {/* Left Branch - Design Path */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="bg-primary/10 w-9 h-9 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <h3 className="text-base font-semibold mb-1 text-center">Exportas STL</h3>
                  <p className="text-xs text-muted-foreground text-center">
                    Convierte a formato STL
                  </p>
                </CardContent>
              </Card>

              {/* Right Branch - Download Path */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="bg-secondary/10 w-9 h-9 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-sm font-bold text-secondary">2</span>
                  </div>
                  <h3 className="text-base font-semibold mb-1 text-center">Ya tienes STL</h3>
                  <p className="text-xs text-muted-foreground text-center">
                    Archivo listo para usar
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Convergent Lines - Meet in the middle */}
            <div className="flex justify-center mb-2">
              <svg viewBox="0 0 400 30" className="w-full max-w-2xl h-6" preserveAspectRatio="none">
                <path d="M 100 0 L 200 30" stroke="hsl(var(--primary))" strokeWidth="2" fill="none"/>
                <path d="M 300 0 L 200 30" stroke="hsl(var(--secondary))" strokeWidth="2" fill="none"/>
              </svg>
            </div>

            {/* Step 3 */}
            <div className="flex justify-center mb-2">
              <Card className="border-2 w-full max-w-sm bg-blue-50/50 dark:bg-blue-900/10">
                <CardContent className="p-4">
                  <div className="bg-blue-100/50 dark:bg-blue-900/20 w-9 h-9 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-sm font-bold text-blue-600">3</span>
                  </div>
                  <h3 className="text-base font-semibold mb-1 text-center">Compartes en VoxelHub</h3>
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    Sube el archivo STL
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Recibes ofertas de makers
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Connector Line Down */}
            <div className="flex justify-center mb-2">
              <div className="w-1 h-4 bg-gradient-to-b from-blue-600 to-transparent"></div>
            </div>

            {/* Step 4 - Final */}
            <div className="flex justify-center">
              <Card className="border-2 w-full max-w-sm bg-green-50/50 dark:bg-green-900/10">
                <CardContent className="p-4">
                  <div className="bg-green-100/50 dark:bg-green-900/20 w-9 h-9 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-sm font-bold text-green-600">4</span>
                  </div>
                  <h3 className="text-base font-semibold mb-1 text-center">¡Acuerdo Cerrado!</h3>
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    Elige la oferta que más te convenga
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Recibes tu impresión 3D lista
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">¿Por qué STL?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Grid3X3 className="h-8 w-8 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Universal</h3>
                    <p className="text-muted-foreground">
                      Todas las impresoras 3D del mundo entienden STL. Es el estándar de la industria.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Zap className="h-8 w-8 text-secondary mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Eficiente</h3>
                    <p className="text-muted-foreground">
                      Archivos pequeños y fáciles de compartir. Puedes enviarlos por email o por aquí.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Lock className="h-8 w-8 text-green-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Compatible</h3>
                    <p className="text-muted-foreground">
                      Abierto y libre. Ningún software propietario. Cualquiera puede leerlo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 hover-elevate">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Package className="h-8 w-8 text-purple-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Preciso</h3>
                    <p className="text-muted-foreground">
                      Mantiene todos los detalles de tu diseño. Precisión hasta la décima de milímetro.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Example Section */}
        <Card className="border-2 mb-12 bg-muted/30">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold mb-4">Ejemplo Real</h2>
            <p className="text-muted-foreground mb-4">
              Quieres imprimir un <strong>soporte para teléfono</strong>:
            </p>
            <ul className="space-y-2 text-muted-foreground mb-6">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">1.</span>
                <span>Diseñas o descargas en TinkerCAD o Thingiverse</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">2.</span>
                <span>Exportas → Descargas "soporte.stl"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">3.</span>
                <span>Subes aquí en VoxelHub con material PLA</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">4.</span>
                <span>5 makers envían ofertas en 2 horas</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">5.</span>
                <span>Elijes la oferta que más te convenga</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">6.</span>
                <span>Recibes tu impresión 3D </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-3">¿Listo para empezar?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sube tu primer archivo STL y conecta con makers profesionales que pueden hacerlo realidad.
            </p>
          </div>
          <Button 
            size="lg" 
            className="px-8"
            onClick={() => setLocation("/auth?type=client&redirectTo=/what-is-stl")}
            data-testid="button-get-started-stl"
          >
            Empezar Ahora
          </Button>
        </div>
      </div>
    </div>
  );
}
