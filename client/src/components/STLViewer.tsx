import { useEffect, useRef, useState, memo, useCallback } from "react";
import * as THREE from "three";

// STLLoader implementation
class STLLoader {
  load(
    url: string,
    onLoad: (geometry: THREE.BufferGeometry) => void,
    onProgress?: (event: ProgressEvent) => void,
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

      offset += 2; // attribute byte count
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

      // Reset vertex pattern lastIndex
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

interface STLViewerProps {
  projectId: string;
  width?: number;
  height?: number;
  stlIndex?: number;
  onIndexChange?: (index: number) => void;
  totalStls?: number;
}

const STLViewerComponent = ({ projectId, width = 400, height = 250, stlIndex = 0, onIndexChange, totalStls = 1 }: STLViewerProps) => {
  const containerRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const animationIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize scene once on mount
  useEffect(() => {
    if (!containerRef.current || sceneRef.current) return;

    try {
      // Scene setup - only once
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0a);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 150;

      // Renderer setup - use canvas element directly with optimizations
      const renderer = new THREE.WebGLRenderer({ 
        canvas: containerRef.current,
        antialias: false,  // Disable antialias for performance
        alpha: true,
        precision: 'lowp'  // Use low precision for mobile perf
      });
      renderer.setPixelRatio(0.5);  // Half pixel ratio for speed
      renderer.setSize(width, height);
      rendererRef.current = renderer;

      // Lighting - only once
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(50, 100, 50);
      scene.add(directionalLight);

      // Mouse events - rotate on hover without clicking
      const onMouseEnter = () => {
        mouseRef.current.isDown = true;
      };

      const onMouseLeave = () => {
        mouseRef.current.isDown = false;
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!mouseRef.current.isDown || !meshRef.current) return;

        const deltaX = e.clientX - mouseRef.current.x;
        const deltaY = e.clientY - mouseRef.current.y;

        rotationRef.current.y += deltaX * 0.025;
        rotationRef.current.x += deltaY * 0.025;

        meshRef.current.rotation.y = rotationRef.current.y;
        meshRef.current.rotation.x = rotationRef.current.x;

        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
      };

      if (containerRef.current) {
        containerRef.current.addEventListener("mouseenter", onMouseEnter, false);
        containerRef.current.addEventListener("mouseleave", onMouseLeave, false);
        containerRef.current.addEventListener("mousemove", onMouseMove, false);
      }

      // Animation loop with throttling - only render on demand
      let frameTime = 0;
      let lastRenderTime = 0;
      const throttleMs = 33; // ~30fps max
      
      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate);
        frameTime = Date.now();
        
        // Only render if enough time has passed OR there's mouse interaction
        if (frameTime - lastRenderTime >= throttleMs || mouseRef.current.isDown) {
          renderer.render(scene, camera);
          lastRenderTime = frameTime;
        }
      };
      animate();

      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener("mouseenter", onMouseEnter, false);
          containerRef.current.removeEventListener("mouseleave", onMouseLeave, false);
          containerRef.current.removeEventListener("mousemove", onMouseMove, false);
        }
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
        renderer.dispose();
      };
    } catch (err) {
      setError("Error inicializando el visor 3D");
      setIsLoading(false);
    }
  }, [width, height]);

  // Load STL when index changes - only change mesh, don't rebuild scene
  useEffect(() => {
    if (!sceneRef.current || !projectId) return;

    // Remove old mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      (meshRef.current.geometry as THREE.BufferGeometry).dispose();
      (meshRef.current.material as THREE.Material).dispose();
      meshRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    const loader = new STLLoader();
    const fileUrl = `/api/projects/${projectId}/stl-content?index=${stlIndex}`;

    loader.load(
      fileUrl,
      (geometry: THREE.BufferGeometry) => {
        if (!sceneRef.current) return;

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
        sceneRef.current.add(mesh);
        setIsLoading(false);
      },
      undefined,
      (error: any) => {
        console.error("Error loading STL:", error);
        setError("No se pudo cargar el modelo STL");
        setIsLoading(false);
      }
    );
  }, [projectId, stlIndex]);

  const handlePrevious = useCallback(() => {
    if (stlIndex > 0 && onIndexChange) {
      onIndexChange(stlIndex - 1);
    }
  }, [stlIndex, onIndexChange]);

  const handleNext = useCallback(() => {
    if (stlIndex < totalStls - 1 && onIndexChange) {
      onIndexChange(stlIndex + 1);
    }
  }, [stlIndex, totalStls, onIndexChange]);

  return (
    <div className="bg-background rounded-lg pointer-events-auto relative" style={{ width: `${width}px`, height: `${height}px`, overflow: 'hidden', display: 'block' }}>
      <canvas
        ref={containerRef as any}
        width={width}
        height={height}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`, 
          display: 'block',
          margin: 0,
          padding: 0
        }}
        className="cursor-grab active:cursor-grabbing"
      />
      
      {/* Navigation Buttons */}
      {totalStls > 1 && (
        <>
          <button
            onClick={handlePrevious}
            disabled={stlIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/95 disabled:opacity-50 p-2 rounded-full z-10 transition-all"
            data-testid="button-stl-prev"
          >
            ←
          </button>
          <button
            onClick={handleNext}
            disabled={stlIndex === totalStls - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/95 disabled:opacity-50 p-2 rounded-full z-10 transition-all"
            data-testid="button-stl-next"
          >
            →
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-2 py-1 rounded text-xs text-muted-foreground z-10">
            {stlIndex + 1}/{totalStls}
          </div>
        </>
      )}

      {isLoading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} className="flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground mt-2">Cargando modelo...</p>
          </div>
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} className="flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
};

export const STLViewer = memo(STLViewerComponent);
