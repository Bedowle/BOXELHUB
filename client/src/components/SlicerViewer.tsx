import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, RotateCw, Download, Loader2 } from "lucide-react";

interface SlicerViewerProps {
  stlContent: string;
  onSlice: (params: any) => void;
  isSlicing?: boolean;
}

export function SlicerViewer({ stlContent, onSlice, isSlicing = false }: SlicerViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  // Parámetros avanzados de laminación
  const [nozzleTemp, setNozzleTemp] = useState(210);
  const [bedTemp, setBedTemp] = useState(60);
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [infillDensity, setInfillDensity] = useState(15);
  const [printSpeed, setPrintSpeed] = useState(100);
  const [wallThickness, setWallThickness] = useState(1.2);
  const [topBottomLayers, setTopBottomLayers] = useState(4);
  const [supportEnabled, setSupportEnabled] = useState(false);

  // Controles de rotación
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [rotationZ, setRotationZ] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Crear escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa);
    sceneRef.current = scene;

    // Cámara
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 150;
    cameraRef.current = camera;

    // Renderizador
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Luces
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(200, 200, 200);
    scene.add(light);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Plano de cama (cama de impresión)
    const bedGeometry = new THREE.PlaneGeometry(200, 200);
    const bedMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const bedMesh = new THREE.Mesh(bedGeometry, bedMaterial);
    bedMesh.rotation.x = -Math.PI / 2;
    bedMesh.position.y = -80;
    scene.add(bedMesh);

    // Grid helper en la cama
    const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0xcccccc);
    gridHelper.position.y = -80;
    scene.add(gridHelper);

    // Cargar STL
    try {
      const geometry = parseSTL(stlContent);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00aa00,
        metalness: 0.3,
        roughness: 0.7,
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Centrar el mesh
      geometry.center();
      geometry.computeBoundingBox();
      const size = geometry.boundingBox!.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 100 / maxDim;
      mesh.scale.multiplyScalar(scale);

      meshRef.current = mesh;
      scene.add(mesh);
    } catch (error) {
      console.error("Error loading STL:", error);
    }

    // Animación de renderizado
    const animate = () => {
      requestAnimationFrame(animate);

      if (meshRef.current) {
        meshRef.current.rotation.x = rotationX;
        meshRef.current.rotation.y = rotationY;
        meshRef.current.rotation.z = rotationZ;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [rotationX, rotationY, rotationZ]);

  const parseSTL = (content: string): THREE.BufferGeometry => {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];

    // Parse ASCII STL
    const lines = content.split("\n");
    const vertexPattern = /vertex\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;
    const normalPattern = /facet normal\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;

    let normalMatch;
    while ((normalMatch = normalPattern.exec(content)) !== null) {
      normals.push(parseFloat(normalMatch[1]), parseFloat(normalMatch[3]), parseFloat(normalMatch[5]));
    }

    let vertexMatch;
    while ((vertexMatch = vertexPattern.exec(content)) !== null) {
      vertices.push(parseFloat(vertexMatch[1]), parseFloat(vertexMatch[3]), parseFloat(vertexMatch[5]));
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
    if (normals.length > 0) {
      geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
    } else {
      geometry.computeVertexNormals();
    }

    return geometry;
  };

  const handleResetRotation = () => {
    setRotationX(0);
    setRotationY(0);
    setRotationZ(0);
  };

  const handleSlice = () => {
    onSlice({
      nozzleTemp,
      bedTemp,
      layerHeight,
      infillDensity,
      printSpeed,
      wallThickness,
      topBottomLayers,
      supportEnabled,
      rotationX,
      rotationY,
      rotationZ,
    });
  };

  return (
    <div className="space-y-4">
      {/* Visor 3D */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-sm">Laminador 3D - Vista Previa</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={containerRef}
            style={{ width: "100%", height: "400px", borderRadius: "8px", overflow: "hidden" }}
            className="bg-gray-100 dark:bg-gray-800"
          />
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={handleResetRotation}>
              <RotateCw className="h-4 w-4 mr-2" />
              Restablecer Rotación
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Controles de Posicionamiento */}
      <Card className="border-purple-200 dark:border-purple-900">
        <CardHeader>
          <CardTitle className="text-sm">Posicionamiento 3D</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Rotación X: {(rotationX * 180 / Math.PI).toFixed(0)}°</label>
            <Slider
              value={[(rotationX * 180) / Math.PI]}
              onValueChange={(v) => setRotationX((v[0] * Math.PI) / 180)}
              min={-180}
              max={180}
              step={1}
              className="mt-2"
              data-testid="slider-rotation-x"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Rotación Y: {(rotationY * 180 / Math.PI).toFixed(0)}°</label>
            <Slider
              value={[(rotationY * 180) / Math.PI]}
              onValueChange={(v) => setRotationY((v[0] * Math.PI) / 180)}
              min={-180}
              max={180}
              step={1}
              className="mt-2"
              data-testid="slider-rotation-y"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Rotación Z: {(rotationZ * 180 / Math.PI).toFixed(0)}°</label>
            <Slider
              value={[(rotationZ * 180) / Math.PI]}
              onValueChange={(v) => setRotationZ((v[0] * Math.PI) / 180)}
              min={-180}
              max={180}
              step={1}
              className="mt-2"
              data-testid="slider-rotation-z"
            />
          </div>
        </CardContent>
      </Card>

      {/* Parámetros de Laminación */}
      <Card className="border-amber-200 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="text-sm">Parámetros de Impresión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Temp. Boquilla: {nozzleTemp}°C</label>
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
              <label className="text-sm font-medium">Temp. Cama: {bedTemp}°C</label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Altura Capa: {layerHeight.toFixed(2)}mm</label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Velocidad: {printSpeed}mm/s</label>
              <Slider
                value={[printSpeed]}
                onValueChange={(v) => setPrintSpeed(v[0])}
                min={10}
                max={200}
                step={5}
                className="mt-2"
                data-testid="slider-print-speed"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Grosor Pared: {wallThickness.toFixed(1)}mm</label>
              <Slider
                value={[wallThickness * 10]}
                onValueChange={(v) => setWallThickness(v[0] / 10)}
                min={8}
                max={40}
                step={2}
                className="mt-2"
                data-testid="slider-wall-thickness"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Capas Superior/Inferior: {topBottomLayers}</label>
            <Slider
              value={[topBottomLayers]}
              onValueChange={(v) => setTopBottomLayers(v[0])}
              min={1}
              max={10}
              step={1}
              className="mt-2"
              data-testid="slider-top-bottom"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="support-enabled"
              checked={supportEnabled}
              onChange={(e) => setSupportEnabled(e.target.checked)}
              className="h-4 w-4"
              data-testid="checkbox-supports"
            />
            <label htmlFor="support-enabled" className="text-sm font-medium">
              Habilitar Soportes
            </label>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-900">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Ajusta la posición del modelo girándolo, y todos los parámetros para optimizar tu impresión
              </p>
            </div>
          </div>

          <Button
            onClick={handleSlice}
            disabled={isSlicing}
            className="w-full"
            data-testid="button-slice-now"
          >
            {isSlicing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Laminando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generar G-code y Descargar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
