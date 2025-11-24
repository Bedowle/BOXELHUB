import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Package, Grid3X3, Zap, Lock, ArrowRight, ArrowDown } from "lucide-react";

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

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-12 text-center">¿Cómo funciona?</h2>
          
          {/* Flow Diagram */}
          <div className="overflow-x-auto pb-4">
            <div className="min-w-max px-4 relative pt-4">
              {/* Top Row - All 4 steps */}
              <div className="flex items-center gap-4 justify-start">
                {/* Diseña */}
                <div className="flex-shrink-0 w-40">
                  <Card className="border-2 border-blue-300 dark:border-blue-700">
                    <CardContent className="pt-5 pb-5 text-center text-xs">
                      <div className="bg-blue-100/50 dark:bg-blue-900/20 w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-blue-600 font-bold">1</span>
                      </div>
                      <h3 className="font-semibold mb-1">Diseña</h3>
                      <p className="text-muted-foreground text-xs">Tu modelo</p>
                    </CardContent>
                  </Card>
                </div>

                <ArrowRight className="h-4 w-4 text-blue-600 flex-shrink-0" />

                {/* Exporta STL */}
                <div className="flex-shrink-0 w-40">
                  <Card className="border-2 border-blue-300 dark:border-blue-700">
                    <CardContent className="pt-5 pb-5 text-center text-xs">
                      <div className="bg-blue-100/50 dark:bg-blue-900/20 w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-blue-600 font-bold">2</span>
                      </div>
                      <h4 className="font-semibold mb-1">Exporta STL</h4>
                      <p className="text-muted-foreground text-xs">Archivo 3D</p>
                    </CardContent>
                  </Card>
                </div>

                <ArrowRight className="h-4 w-4 text-secondary flex-shrink-0" />

                {/* Comparte */}
                <div className="flex-shrink-0 w-40">
                  <Card className="border-2 border-secondary">
                    <CardContent className="pt-5 pb-5 text-center text-xs">
                      <div className="bg-secondary/10 w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="font-bold text-secondary">3</span>
                      </div>
                      <h3 className="font-semibold mb-1">Comparte</h3>
                      <p className="text-muted-foreground text-xs">VoxelHub</p>
                    </CardContent>
                  </Card>
                </div>

                <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />

                {/* Recibe Ofertas */}
                <div className="flex-shrink-0 w-40">
                  <Card className="border-2 bg-green-100/10 dark:bg-green-900/10">
                    <CardContent className="pt-5 pb-5 text-center text-xs">
                      <div className="bg-green-100/50 dark:bg-green-900/20 w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="font-bold text-green-600">4</span>
                      </div>
                      <h3 className="font-semibold mb-1">Recibe</h3>
                      <p className="text-muted-foreground text-xs">Ofertas</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Bottom Row - Descarga */}
              <div className="flex items-center gap-4 justify-start mt-12">
                {/* Descarga */}
                <div className="flex-shrink-0 w-40">
                  <Card className="border-2 border-green-300 dark:border-green-700">
                    <CardContent className="pt-5 pb-5 text-center text-xs">
                      <div className="bg-green-100/50 dark:bg-green-900/20 w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-green-600 font-bold">1</span>
                      </div>
                      <h3 className="font-semibold mb-1">Descarga</h3>
                      <p className="text-muted-foreground text-xs">STL listo</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Arrow from Descarga pointing right to Comparte */}
                <div className="flex-grow h-px border-t-2 border-green-600" style={{ minWidth: "16rem" }}></div>
                <ArrowRight className="h-4 w-4 text-green-600 flex-shrink-0" />
              </div>

              {/* SVG Arrows Connector */}
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible" style={{ height: "280px" }}>
                {/* Arrow from Exporta down to Comparte */}
                <path
                  d="M 240 60 Q 280 100 320 140"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-blue-600"
                />
                <polygon points="320,140 315,130 325,135" className="text-blue-600" fill="currentColor" />

                {/* Arrow from Descarga right to Comparte */}
                <path
                  d="M 120 200 L 310 200 L 310 150"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-green-600"
                />
                <polygon points="310,150 305,160 315,155" className="text-green-600" fill="currentColor" />
              </svg>
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
                <span>Diseñas en TinkerCAD (es gratis y online)</span>
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
