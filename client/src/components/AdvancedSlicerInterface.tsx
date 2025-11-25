import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Loader2, RotateCw, Code2, AlertCircle } from "lucide-react";
import type { SliceEstimate } from "@shared/schema";

interface AdvancedSlicerProps {
  projectId: string;
  disabled?: boolean;
}

class STLLoader {
  load(
    url: string,
    onLoad: (geometry: THREE.BufferGeometry) => void,
    onError?: (event: ErrorEvent) => void
  ) {
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => {
        const geometry = this.parse(arrayBuffer);
        onLoad(geometry);
      })
      .catch((error) => {
        if (onError) onError(error as ErrorEvent);
      });
  }

  parse(arrayBuffer: ArrayBuffer): THREE.BufferGeometry {
    const view = new DataView(arrayBuffer);
    const isASCII = this.isASCIISTL(arrayBuffer);
    if (isASCII) {
      return this.parseASCII(new TextDecoder().decode(arrayBuffer));
    } else {
      return this.parseBinary(arrayBuffer);
    }
  }

  isASCIISTL(arrayBuffer: ArrayBuffer): boolean {
    const view = new Uint8Array(arrayBuffer);
    const header = new TextDecoder().decode(view.slice(0, 5));
    return header === "solid";
  }

  parseBinary(arrayBuffer: ArrayBuffer): THREE.BufferGeometry {
    const view = new DataView(arrayBuffer);
    const faces = view.getUint32(80, true);
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];

    let offset = 84;
    for (let i = 0; i < faces; i++) {
      const nx = view.getFloat32(offset, true);
      offset += 4;
      const ny = view.getFloat32(offset, true);
      offset += 4;
      const nz = view.getFloat32(offset, true);
      offset += 4;

      for (let j = 0; j < 3; j++) {
        vertices.push(view.getFloat32(offset, true));
        offset += 4;
        vertices.push(view.getFloat32(offset, true));
        offset += 4;
        vertices.push(view.getFloat32(offset, true));
        offset += 4;
        normals.push(nx, ny, nz);
      }
      offset += 2;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
    return geometry;
  }

  parseASCII(data: string): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];

    const vertexPattern = /vertex\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;
    const normalPattern = /facet\s+normal\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;

    let normalMatch;
    let vertexMatch;
    let currentNormal = [0, 0, 0];

    while ((normalMatch = normalPattern.exec(data)) !== null) {
      currentNormal = [parseFloat(normalMatch[1]), parseFloat(normalMatch[3]), parseFloat(normalMatch[5])];
      vertexPattern.lastIndex = normalMatch.index;

      for (let i = 0; i < 3; i++) {
        vertexMatch = vertexPattern.exec(data);
        if (vertexMatch) {
          vertices.push(
            parseFloat(vertexMatch[1]),
            parseFloat(vertexMatch[3]),
            parseFloat(vertexMatch[5])
          );
          normals.push(...currentNormal);
        }
      }
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
    return geometry;
  }
}

export function AdvancedSlicerInterface({ projectId, disabled = false }: AdvancedSlicerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parámetros Slic3r
  const [params, setParams] = useState({
    nozzleTemp: 210,
    bedTemp: 60,
    layerHeight: 0.2,
    infillDensity: 20,
    printSpeed: 50,
    // Parámetros avanzados
    wallThickness: 1.2,
    nozzleDiameter: 0.4,
    filamentDiameter: 1.75,
    retractDistance: 5,
    retractSpeed: 40,
    firstLayerSpeed: 20,
    supportDensity: 15,
    topSolidLayers: 4,
    bottomSolidLayers: 4,
  });

  const sliceMutation = useMutation({
    mutationFn: async (sliceParams: typeof params) => {
      return apiRequest("POST", `/api/projects/${projectId}/slice-estimate`, sliceParams);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/slice-estimates`] });
    },
  });

  // Cargar STL en Three.js
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(75, 800 / 500, 0.1, 1000);
      camera.position.z = 200;

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(1);
      renderer.setSize(800, 500);
      rendererRef.current = renderer;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
      directionalLight.position.set(50, 100, 50);
      scene.add(directionalLight);

      // Build plate (XY plane at Z=0)
      const plateGeometry = new THREE.PlaneGeometry(200, 200);
      const plateMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        metalness: 0.3,
        roughness: 0.8,
      });
      const plate = new THREE.Mesh(plateGeometry, plateMaterial);
      plate.rotation.x = -Math.PI / 2;
      plate.position.z = -1;
      scene.add(plate);

      // Grid en la placa
      const gridHelper = new THREE.GridHelper(200, 20, 0x444466, 0x333344);
      gridHelper.position.z = -0.8;
      scene.add(gridHelper);

      // Load STL
      const loader = new STLLoader();
      loader.load(
        `/api/projects/${projectId}/stl-content`,
        (geometry: THREE.BufferGeometry) => {
          geometry.computeBoundingBox();
          if (!geometry.boundingBox) return;

          const center = new THREE.Vector3();
          geometry.boundingBox.getCenter(center);
          geometry.translate(-center.x, -center.y, -center.z);

          const material = new THREE.MeshPhongMaterial({
            color: 0x6366f1,
            specular: 0x222233,
            shininess: 100,
            emissive: 0x1e1b4b,
          });

          const mesh = new THREE.Mesh(geometry, material);
          meshRef.current = mesh;
          scene.add(mesh);
          setIsLoading(false);

          // Auto-rotate
          const animate = () => {
            requestAnimationFrame(animate);
            if (meshRef.current) {
              meshRef.current.rotation.x += 0.005;
              meshRef.current.rotation.y += 0.008;
            }
            renderer.render(scene, camera);
          };
          animate();
        },
        (error: any) => {
          console.error("Error loading STL:", error);
          setError("No se pudo cargar el modelo");
          setIsLoading(false);
        }
      );

      return () => {
        renderer.dispose();
      };
    } catch (err) {
      setError("Error en el visor 3D");
      setIsLoading(false);
    }
  }, [projectId]);

  const downloadGCode = async () => {
    const estimates = queryClient.getQueryData<SliceEstimate[]>([
      `/api/projects/${projectId}/slice-estimates`,
    ]);
    const lastEstimate = estimates?.[0];
    if (!lastEstimate || !lastEstimate.gcode) return;

    const element = document.createElement("a");
    const file = new Blob([lastEstimate.gcode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `slice_${lastEstimate.id}.gcode`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const resetRotation = () => {
    if (meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-purple-200 dark:border-purple-900">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="h-5 w-5 text-purple-600" />
            Laminador 3D Interactivo (Slic3r)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-2">
            Arrastra para rotar • Ajusta parámetros • Previsualiza
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visor 3D */}
          <div className="space-y-3">
            <div className="relative bg-black rounded-lg overflow-hidden border border-purple-300/20">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full cursor-grab active:cursor-grabbing"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-400" />
                    <p className="text-sm text-purple-300">Cargando modelo 3D...</p>
                  </div>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 backdrop-blur">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={resetRotation} data-testid="button-reset-rotation">
                <RotateCw className="mr-2 h-4 w-4" />
                Reiniciar Vista
              </Button>
              <Badge variant="secondary" className="ml-auto">
                Arrastra para rotar modelo
              </Badge>
            </div>
          </div>

          {/* Parámetros en Tabs */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básicos</TabsTrigger>
              <TabsTrigger value="advanced">Avanzados</TabsTrigger>
              <TabsTrigger value="support">Soportes</TabsTrigger>
            </TabsList>

            {/* Tab: Básicos */}
            <TabsContent value="basic" className="space-y-5 mt-4">
              <div>
                <label className="text-sm font-medium flex justify-between">
                  <span>Temperatura Boquilla: {params.nozzleTemp}°C</span>
                  <Badge variant="outline">°C</Badge>
                </label>
                <Slider
                  value={[params.nozzleTemp]}
                  onValueChange={(v) => setParams({ ...params, nozzleTemp: v[0] })}
                  min={180}
                  max={260}
                  step={5}
                  disabled={disabled || sliceMutation.isPending}
                  data-testid="slider-nozzle-temp"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex justify-between">
                  <span>Temperatura Cama: {params.bedTemp}°C</span>
                  <Badge variant="outline">°C</Badge>
                </label>
                <Slider
                  value={[params.bedTemp]}
                  onValueChange={(v) => setParams({ ...params, bedTemp: v[0] })}
                  min={20}
                  max={110}
                  step={5}
                  disabled={disabled || sliceMutation.isPending}
                  data-testid="slider-bed-temp"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex justify-between">
                  <span>Altura Capa: {params.layerHeight}mm</span>
                  <Badge variant="outline">mm</Badge>
                </label>
                <Slider
                  value={[params.layerHeight]}
                  onValueChange={(v) => setParams({ ...params, layerHeight: v[0] })}
                  min={0.1}
                  max={0.4}
                  step={0.05}
                  disabled={disabled || sliceMutation.isPending}
                  data-testid="slider-layer-height"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex justify-between">
                  <span>Relleno: {params.infillDensity}%</span>
                  <Badge variant="outline">%</Badge>
                </label>
                <Slider
                  value={[params.infillDensity]}
                  onValueChange={(v) => setParams({ ...params, infillDensity: v[0] })}
                  min={0}
                  max={100}
                  step={5}
                  disabled={disabled || sliceMutation.isPending}
                  data-testid="slider-infill"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex justify-between">
                  <span>Velocidad Impresión: {params.printSpeed}mm/s</span>
                  <Badge variant="outline">mm/s</Badge>
                </label>
                <Slider
                  value={[params.printSpeed]}
                  onValueChange={(v) => setParams({ ...params, printSpeed: v[0] })}
                  min={10}
                  max={150}
                  step={5}
                  disabled={disabled || sliceMutation.isPending}
                  data-testid="slider-print-speed"
                  className="mt-2"
                />
              </div>
            </TabsContent>

            {/* Tab: Avanzados */}
            <TabsContent value="advanced" className="space-y-5 mt-4">
              <div>
                <label className="text-sm font-medium flex justify-between">
                  <span>Espesor Paredes: {params.wallThickness}mm</span>
                </label>
                <Slider
                  value={[params.wallThickness]}
                  onValueChange={(v) => setParams({ ...params, wallThickness: v[0] })}
                  min={0.4}
                  max={4}
                  step={0.2}
                  disabled={disabled || sliceMutation.isPending}
                  data-testid="slider-wall-thickness"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex justify-between">
                  <span>Velocidad Retracción: {params.retractSpeed}mm/s</span>
                </label>
                <Slider
                  value={[params.retractSpeed]}
                  onValueChange={(v) => setParams({ ...params, retractSpeed: v[0] })}
                  min={20}
                  max={100}
                  step={5}
                  disabled={disabled || sliceMutation.isPending}
                  data-testid="slider-retract-speed"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex justify-between">
                  <span>Velocidad Primera Capa: {params.firstLayerSpeed}mm/s</span>
                </label>
                <Slider
                  value={[params.firstLayerSpeed]}
                  onValueChange={(v) => setParams({ ...params, firstLayerSpeed: v[0] })}
                  min={5}
                  max={50}
                  step={5}
                  disabled={disabled || sliceMutation.isPending}
                  data-testid="slider-first-layer-speed"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex justify-between">
                  <span>Capas Superiores Sólidas: {params.topSolidLayers}</span>
                </label>
                <Slider
                  value={[params.topSolidLayers]}
                  onValueChange={(v) => setParams({ ...params, topSolidLayers: v[0] })}
                  min={1}
                  max={10}
                  step={1}
                  disabled={disabled || sliceMutation.isPending}
                  data-testid="slider-top-solid-layers"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex justify-between">
                  <span>Capas Inferiores Sólidas: {params.bottomSolidLayers}</span>
                </label>
                <Slider
                  value={[params.bottomSolidLayers]}
                  onValueChange={(v) => setParams({ ...params, bottomSolidLayers: v[0] })}
                  min={1}
                  max={10}
                  step={1}
                  disabled={disabled || sliceMutation.isPending}
                  data-testid="slider-bottom-solid-layers"
                  className="mt-2"
                />
              </div>
            </TabsContent>

            {/* Tab: Soportes */}
            <TabsContent value="support" className="space-y-5 mt-4">
              <div>
                <label className="text-sm font-medium flex justify-between">
                  <span>Densidad Soportes: {params.supportDensity}%</span>
                </label>
                <Slider
                  value={[params.supportDensity]}
                  onValueChange={(v) => setParams({ ...params, supportDensity: v[0] })}
                  min={5}
                  max={50}
                  step={5}
                  disabled={disabled || sliceMutation.isPending}
                  data-testid="slider-support-density"
                  className="mt-2"
                />
              </div>
              <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                Mayor densidad = más soporte pero más fácil de remover. Menor densidad = menos material pero más difícil.
              </p>
            </TabsContent>
          </Tabs>

          {/* Botones */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => sliceMutation.mutate(params)}
              disabled={disabled || sliceMutation.isPending || isLoading}
              className="flex-1"
              data-testid="button-generate-gcode"
            >
              {sliceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Laminando...
                </>
              ) : (
                <>
                  <Code2 className="mr-2 h-4 w-4" />
                  Generar G-code
                </>
              )}
            </Button>
            <Button
              onClick={downloadGCode}
              disabled={disabled || sliceMutation.isPending || isLoading}
              variant="outline"
              data-testid="button-download-gcode"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          </div>

          {sliceMutation.error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md text-sm text-red-700 dark:text-red-300">
              Error: {(sliceMutation.error as any)?.message || "Fallo al generar G-code"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
