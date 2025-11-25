import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three-stdlib";

interface STLViewerProps {
  stlFileName: string;
  width?: number;
  height?: number;
}

export function STLViewer({ stlFileName, width = 400, height = 250 }: STLViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0a);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 150;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(50, 100, 50);
      scene.add(directionalLight);

      // Load STL
      const loader = new STLLoader();
      const fileUrl = `/uploads/projects/${stlFileName}`;

      loader.load(
        fileUrl,
        (geometry: THREE.BufferGeometry) => {
          geometry.computeBoundingBox();
          
          if (!geometry.boundingBox) return;

          const center = new THREE.Vector3();
          geometry.boundingBox.getCenter(center);
          geometry.translate(-center.x, -center.y, -center.z);

          const material = new THREE.MeshPhongMaterial({
            color: 0x6366f1,
            specular: 0x111111,
            shininess: 200,
            emissive: 0x1e1b4b,
          });

          const mesh = new THREE.Mesh(geometry, material);
          meshRef.current = mesh;
          scene.add(mesh);
          setIsLoading(false);
        },
        undefined,
        (error: any) => {
          console.error("Error loading STL:", error);
          setError("No se pudo cargar el modelo STL");
          setIsLoading(false);
        }
      );

      // Mouse events
      const onMouseDown = (e: MouseEvent) => {
        mouseRef.current.isDown = true;
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!mouseRef.current.isDown || !meshRef.current) return;

        const deltaX = e.clientX - mouseRef.current.x;
        const deltaY = e.clientY - mouseRef.current.y;

        // Rotación en eje Y por movimiento horizontal
        rotationRef.current.y += deltaX * 0.01;
        // Rotación en eje X por movimiento vertical
        rotationRef.current.x += deltaY * 0.01;

        meshRef.current.rotation.y = rotationRef.current.y;
        meshRef.current.rotation.x = rotationRef.current.x;

        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
      };

      const onMouseUp = () => {
        mouseRef.current.isDown = false;
      };

      renderer.domElement.addEventListener("mousedown", onMouseDown);
      renderer.domElement.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      // Handle window resize
      const handleResize = () => {
        const newWidth = containerRef.current?.clientWidth || width;
        const newHeight = containerRef.current?.clientHeight || height;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        renderer.domElement.removeEventListener("mousedown", onMouseDown);
        renderer.domElement.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (err) {
      setError("Error inicializando el visor 3D");
      setIsLoading(false);
    }
  }, [stlFileName, width, height]);

  return (
    <div className="relative bg-background rounded-lg overflow-hidden">
      <div
        ref={containerRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="cursor-grab active:cursor-grabbing"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground mt-2">Cargando modelo...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
