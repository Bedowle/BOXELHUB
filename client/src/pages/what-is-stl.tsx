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
            onClick={() => setLocation("/")}
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

        {/* How It Works - Horizontal Flow Diagram */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">¿Cómo funciona?</h2>
          
          {/* Horizontal Flow */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max justify-center px-4">
              
              {/* 1a - Diseñas */}
              <div className="flex flex-col items-center gap-2">
                <Card className="border-2 w-40">
                  <CardContent className="pt-4 pb-4">
                    <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <span className="text-sm font-bold text-primary">1 a</span>
                    </div>
                    <h3 className="text-sm font-semibold mb-2 text-center">Diseñas</h3>
                    <p className="text-xs text-muted-foreground text-center">
                      Crea con software 3D
                    </p>
                  </CardContent>
                </Card>
                <div className="text-xs text-muted-foreground">Fusion 360, Blender, FreeCAD</div>
              </div>

              {/* Arrow 1a to 2a */}
              <div className="flex items-center">
                <div className="text-2xl text-primary">→</div>
              </div>

              {/* 2a - Exportas */}
              <Card className="border-2 w-40">
                <CardContent className="pt-4 pb-4">
                  <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-sm font-bold text-primary">2 a</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-2 text-center">Exportas como STL</h3>
                  <p className="text-xs text-muted-foreground text-center">
                    Tu diseño en formato STL
                  </p>
                </CardContent>
              </Card>

              {/* Arrow 2a to 3 */}
              <div className="flex items-center">
                <svg viewBox="0 0 30 60" className="w-6 h-12" preserveAspectRatio="none">
                  <path d="M 2 0 L 28 30 L 2 60" stroke="hsl(var(--primary))" strokeWidth="2" fill="none"/>
                </svg>
              </div>

              {/* Arrow 2b to 3 */}
              <div className="flex items-center">
                <svg viewBox="0 0 30 60" className="w-6 h-12" preserveAspectRatio="none">
                  <path d="M 28 0 L 2 30 L 28 60" stroke="hsl(var(--secondary))" strokeWidth="2" fill="none"/>
                </svg>
              </div>

              {/* Arrow 3 to 4 */}
              <div className="flex items-center">
                <div className="text-2xl text-blue-600">→</div>
              </div>

              {/* 3 - Compartes */}
              <Card className="border-2 w-40 bg-blue-50/50 dark:bg-blue-900/10">
                <CardContent className="pt-4 pb-4">
                  <div className="bg-blue-100/50 dark:bg-blue-900/20 w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-sm font-bold text-blue-600">3</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-2 text-center">Compartes en VoxelHub</h3>
                  <p className="text-xs text-muted-foreground text-center">
                    Subes y especificas detalles
                  </p>
                </CardContent>
              </Card>

              {/* Arrow 3 to 4 */}
              <div className="flex items-center">
                <div className="text-2xl text-green-600">→</div>
              </div>

              {/* 4 - Recibes */}
              <Card className="border-2 w-40 bg-green-50/50 dark:bg-green-900/10">
                <CardContent className="pt-4 pb-4">
                  <div className="bg-green-100/50 dark:bg-green-900/20 w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-sm font-bold text-green-600">4</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-2 text-center">Recibes Ofertas</h3>
                  <p className="text-xs text-muted-foreground text-center">
                    Makers compiten
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Second row for 1b and 2b */}
            <div className="flex gap-3 min-w-max justify-center px-4 mt-4">
              
              {/* 1b - Descargas */}
              <div className="flex flex-col items-center gap-2">
                <Card className="border-2 w-40">
                  <CardContent className="pt-4 pb-4">
                    <div className="bg-secondary/10 w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <span className="text-sm font-bold text-secondary">1 b</span>
                    </div>
                    <h3 className="text-sm font-semibold mb-2 text-center">Descargas</h3>
                    <p className="text-xs text-muted-foreground text-center">
                      Modelo listo para usar
                    </p>
                  </CardContent>
                </Card>
                <div className="text-xs text-muted-foreground">Thingiverse, Cults3D</div>
              </div>

              {/* Arrow 1b to 2b */}
              <div className="flex items-center">
                <div className="text-2xl text-secondary">→</div>
              </div>

              {/* 2b - Ya tienes */}
              <Card className="border-2 w-40">
                <CardContent className="pt-4 pb-4">
                  <div className="bg-secondary/10 w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-sm font-bold text-secondary">2 b</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-2 text-center">Ya tienes un STL</h3>
                  <p className="text-xs text-muted-foreground text-center">
                    Archivo listo para compartir
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
                <span>Elijes la mejor, ¡listo!</span>
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
            onClick={() => setLocation("/auth?type=client")}
            data-testid="button-get-started-stl"
          >
            Empezar Ahora
          </Button>
        </div>
      </div>
    </div>
  );
}
