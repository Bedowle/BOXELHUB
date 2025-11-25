import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Zap, Loader2 } from "lucide-react";
import type { SliceEstimate } from "@shared/schema";

interface SliceEstimatorProps {
  projectId: string;
  disabled?: boolean;
}

export function SliceEstimator({ projectId, disabled = false }: SliceEstimatorProps) {
  const { data: estimates } = useQuery<SliceEstimate[]>({
    queryKey: [`/api/projects/${projectId}/slice-estimates`],
    enabled: !!projectId,
  });

  // Si no hay estimaciones previas, mostrar formulario abierto desde el inicio
  const [isOpen, setIsOpen] = useState(!estimates || estimates.length === 0);
  const [nozzleTemp, setNozzleTemp] = useState(200);
  const [bedTemp, setBedTemp] = useState(60);
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [infillDensity, setInfillDensity] = useState(20);
  const [printSpeed, setPrintSpeed] = useState(50);

  const sliceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/slice-estimate`, {
        nozzleTemp,
        bedTemp,
        layerHeight,
        infillDensity,
        printSpeed,
      });
      return res.json();
    },
    onSuccess: () => {
      // Reset form
      setNozzleTemp(200);
      setBedTemp(60);
      setLayerHeight(0.2);
      setInfillDensity(20);
      setPrintSpeed(50);
      setIsOpen(false);
    },
  });

  const lastEstimate = estimates?.[0];

  return (
    <div className="space-y-4">
      {lastEstimate && !isOpen && (
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Última Estimación de Laminación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Tiempo Estimado</p>
                <p className="text-lg font-semibold">{lastEstimate.estimatedTime} min</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peso de Filamento</p>
                <p className="text-lg font-semibold">{lastEstimate.materialUsedGrams}g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Capas</p>
                <p className="text-lg font-semibold">{lastEstimate.estimatedLayers}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peso Estimado</p>
                <p className="text-lg font-semibold">{lastEstimate.estimatedWeight}g</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="default" onClick={() => setIsOpen(true)} data-testid="button-re-estimate">
                Nueva Estimación
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsOpen(true)} data-testid="button-toggle-params">
                Ver Parámetros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Calcular Estimación de Laminación
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-2">Ajusta los parámetros y haz clic para estimar</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium">Temperatura de Boquilla: {nozzleTemp}°C</label>
              <Slider
                value={[nozzleTemp]}
                onValueChange={(v) => setNozzleTemp(v[0])}
                min={180}
                max={260}
                step={5}
                className="mt-2"
                data-testid="slider-nozzle-temp"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Temperatura de Cama: {bedTemp}°C</label>
              <Slider
                value={[bedTemp]}
                onValueChange={(v) => setBedTemp(v[0])}
                min={20}
                max={110}
                step={5}
                className="mt-2"
                data-testid="slider-bed-temp"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Altura de Capa: {layerHeight.toFixed(2)}mm</label>
              <Slider
                value={[layerHeight * 100]}
                onValueChange={(v) => setLayerHeight(v[0] / 100)}
                min={10}
                max={40}
                step={1}
                className="mt-2"
                data-testid="slider-layer-height"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Relleno: {infillDensity}%</label>
              <Slider
                value={[infillDensity]}
                onValueChange={(v) => setInfillDensity(v[0])}
                min={0}
                max={100}
                step={5}
                className="mt-2"
                data-testid="slider-infill"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Velocidad de Impresión: {printSpeed}mm/s</label>
              <Slider
                value={[printSpeed]}
                onValueChange={(v) => setPrintSpeed(v[0])}
                min={10}
                max={150}
                step={5}
                className="mt-2"
                data-testid="slider-print-speed"
              />
            </div>

            <div className="flex gap-2 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Los parámetros se usan para estimar. El STL permanece seguro hasta que el cliente apruebe tu oferta.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => sliceMutation.mutate()}
                disabled={disabled || sliceMutation.isPending}
                className="flex-1"
                data-testid="button-slice-estimate"
              >
                {sliceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Estimando...
                  </>
                ) : (
                  "Estimar Laminación"
                )}
              </Button>
              {lastEstimate && (
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  data-testid="button-close-params"
                >
                  Cerrar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
