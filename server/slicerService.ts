import { execSync, exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

interface SlicingOptions {
  nozzleDiameter?: number; // mm
  layerHeight: number; // mm
  infillDensity: number; // 0-100 %
  infillPattern?: "rectilinear" | "honeycomb" | "gyroid";
  nozzleTemp: number; // °C
  bedTemp: number; // °C
  printSpeed: number; // mm/s
}

export interface SlicingResult {
  gcode: string; // G-code content
  estimatedTime: number; // minutes
  estimatedWeight: number; // grams
  estimatedLayers: number;
  materialUsedMm3: number;
}

/**
 * Real slicing using Slic3r CLI
 * STL file is never exposed - stays on server
 */
export async function sliceSTLToGCode(
  stlFilePath: string,
  options: SlicingOptions
): Promise<SlicingResult> {
  try {
    // Verify STL file exists
    if (!fs.existsSync(stlFilePath)) {
      throw new Error("STL file not found");
    }

    // Create temporary output directory
    const tmpDir = path.join("/tmp", `slice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const outputGcodePath = path.join(tmpDir, "output.gcode");
    const configFile = path.join(tmpDir, "printer_config.ini");

    // Create minimal Slic3r config
    const configContent = `
[printer]
nozzle_diameter = ${options.nozzleDiameter || 0.4}
layer_height = ${options.layerHeight}

[filament]
temperature = ${options.nozzleTemp}
bed_temperature = ${options.bedTemp}

[print]
infill_density = ${options.infillDensity}
perimeters = 2
top_solid_layers = 4
bottom_solid_layers = 3
fill_pattern = ${options.infillPattern || "honeycomb"}
travel_speed = 150
perimeter_speed = 60
infill_speed = ${options.printSpeed}
solid_infill_speed = ${options.printSpeed}
`;

    fs.writeFileSync(configFile, configContent);

    // Call Slic3r CLI
    const cmd = `slic3r --load "${configFile}" --output "${outputGcodePath}" "${stlFilePath}" 2>&1`;

    try {
      const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });
      console.log("Slic3r output:", stdout);
      if (stderr) console.log("Slic3r stderr:", stderr);
    } catch (error: any) {
      console.error("Slic3r execution error:", error);
      // Slic3r might still generate output even if it "fails"
    }

    // Check if G-code was generated
    if (!fs.existsSync(outputGcodePath)) {
      throw new Error("Failed to generate G-code");
    }

    // Read G-code
    const gcode = fs.readFileSync(outputGcodePath, "utf-8");

    // Parse G-code to extract metrics
    const metrics = parseGCodeMetrics(gcode);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return {
      gcode,
      estimatedTime: metrics.estimatedTime,
      estimatedWeight: metrics.estimatedWeight,
      estimatedLayers: metrics.estimatedLayers,
      materialUsedMm3: metrics.materialUsedMm3,
    };
  } catch (error) {
    console.error("Slicing error:", error);
    throw error;
  }
}

interface GCodeMetrics {
  estimatedTime: number;
  estimatedWeight: number;
  estimatedLayers: number;
  materialUsedMm3: number;
}

/**
 * Parse G-code to extract slicing metrics
 */
function parseGCodeMetrics(gcode: string): GCodeMetrics {
  const lines = gcode.split("\n");

  let estimatedTime = 0; // seconds
  let materialUsedMm3 = 0;
  let estimatedLayers = 0;
  let maxZ = 0;

  // Parse comments and G-code
  for (const line of lines) {
    // Look for time estimate in comments (Slic3r format)
    if (line.includes("estimated printing time") || line.includes("time")) {
      const match = line.match(/(\d+)[hms]/gi);
      if (match) {
        for (const m of match) {
          const num = parseInt(m);
          if (m.includes("h")) estimatedTime += num * 3600;
          if (m.includes("m")) estimatedTime += num * 60;
          if (m.includes("s")) estimatedTime += num;
        }
      }
    }

    // Track material (E axis)
    if (line.startsWith("G1") && line.includes("E")) {
      const eMatch = line.match(/E([\d.]+)/);
      if (eMatch) {
        const eValue = parseFloat(eMatch[1]);
        materialUsedMm3 += eValue * 2.4; // rough conversion: filament mm to volume mm³
      }
    }

    // Track Z position for layer count
    if (line.includes("Z")) {
      const zMatch = line.match(/Z([\d.]+)/);
      if (zMatch) {
        maxZ = Math.max(maxZ, parseFloat(zMatch[1]));
      }
    }
  }

  // Estimate layers (typical layer height 0.2mm)
  estimatedLayers = Math.round(maxZ / 0.2) || 100;

  // Convert material volume to grams (PLA density ~1.24 g/cm³ = 1.24 mg/mm³)
  const estimatedWeight = materialUsedMm3 * 0.00124;

  // Fallback estimates if parsing failed
  return {
    estimatedTime: Math.max(estimatedTime || 3600, 300), // min 5 minutes
    estimatedWeight: Math.round(estimatedWeight * 100) / 100 || 25,
    estimatedLayers: estimatedLayers || 100,
    materialUsedMm3: Math.round(materialUsedMm3 * 100) / 100 || 5000,
  };
}
