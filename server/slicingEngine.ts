// Intelligent slicing estimation engine (no G-code exposure)
export interface SlicingParams {
  nozzleTemp: number; // °C
  bedTemp: number; // °C
  layerHeight: number; // mm
  infillDensity: number; // 0-100 %
  printSpeed: number; // mm/s
}

export interface SlicingEstimate {
  estimatedWeight: number; // grams
  estimatedTime: number; // minutes
  estimatedLayers: number;
  materialUsedGrams: number; // g
}

// Mock slicing engine - calculates realistic estimates without exposing STL
export function estimateSlicing(
  stlContent: string,
  params: SlicingParams
): SlicingEstimate {
  try {
    // Parse STL to get bounding box (simple ASCII STL parser)
    const vertices = extractVerticesFromSTL(stlContent);
    if (vertices.length === 0) {
      throw new Error("No vertices found in STL");
    }

    const bounds = getBoundingBox(vertices);
    const volume = calculateVolume(bounds);

    // Filament density (PLA ~1.24 g/cm³)
    const filamentDensity = 1.24;
    
    // Base weight calculation
    const infillFactor = params.infillDensity / 100;
    const materialWeight = volume * filamentDensity * infillFactor;

    // Print time estimation (based on volume, layer height, and speed)
    // Rough formula: time ≈ (volume / layer_height) / speed * some_factor
    const numLayers = Math.ceil(bounds.maxZ / params.layerHeight);
    const timePerLayer = 8 + (bounds.maxX * bounds.maxY) / (params.printSpeed * 10); // seconds
    const printTime = (numLayers * timePerLayer) / 60; // convert to minutes

    return {
      estimatedWeight: Math.round(materialWeight * 100) / 100,
      estimatedTime: Math.max(5, Math.round(printTime)),
      estimatedLayers: numLayers,
      materialUsedGrams: Math.round(materialWeight * 100) / 100,
    };
  } catch (error) {
    // Fallback estimates if parsing fails
    return {
      estimatedWeight: 25,
      estimatedTime: 120,
      estimatedLayers: 240,
      materialUsedGrams: 25,
    };
  }
}

function extractVerticesFromSTL(stlContent: string): Array<[number, number, number]> {
  const vertices: Array<[number, number, number]> = [];
  
  try {
    // Check if binary or ASCII
    if (stlContent.trim().toLowerCase().startsWith("solid")) {
      // ASCII STL format
      const vertexRegex = /vertex\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)/gi;
      let match;
      while ((match = vertexRegex.exec(stlContent)) !== null) {
        vertices.push([parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])]);
      }
    }
  } catch (error) {
    // Ignore parsing errors
  }

  return vertices;
}

function getBoundingBox(vertices: Array<[number, number, number]>) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const [x, y, z] of vertices) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }

  return {
    minX, maxX, minY, maxY, minZ, maxZ,
    width: maxX - minX,
    depth: maxY - minY,
    height: maxZ - minZ,
    maxX: maxX - minX,
    maxY: maxY - minY,
    maxZ: maxZ - minZ,
  };
}

function calculateVolume(bounds: any): number {
  // Rough volume estimate (assuming max 60% fill of bounding box)
  return bounds.maxX * bounds.maxY * bounds.maxZ * 0.6;
}
