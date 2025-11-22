import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Label } from "@/components/ui/label";

interface LocationData {
  latitude: string;
  longitude: string;
  radius: number; // 0 = exact pin, 1+ = approximate circle in km
}

interface LocationMapPickerProps {
  value: LocationData;
  onChange: (data: LocationData) => void;
  isApproximate?: boolean; // true = show circle, false = show pin only
}

export default function LocationMapPicker({ value, onChange, isApproximate = false }: LocationMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultLat = value.latitude ? parseFloat(value.latitude) : 40.4168;
    const defaultLng = value.longitude ? parseFloat(value.longitude) : -3.7038;

    // Create map
    const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add marker
    const marker = L.marker([defaultLat, defaultLng], {
      icon: L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;

    // Add circle if approximate
    if (isApproximate) {
      const circle = L.circle([defaultLat, defaultLng], {
        color: "#8B5CF6",
        fillColor: "#A78BFA",
        fillOpacity: 0.2,
        radius: 1000, // 1 km
      }).addTo(map);
      circleRef.current = circle;
    }

    // Update on marker drag
    const updateLocation = () => {
      const lat = marker.getLatLng().lat;
      const lng = marker.getLatLng().lng;
      onChange({
        latitude: lat.toString(),
        longitude: lng.toString(),
        radius: isApproximate ? 1 : 0,
      });

      // Update circle position if approximate
      if (circleRef.current) {
        circleRef.current.setLatLng([lat, lng]);
      }
    };

    marker.on("dragend", updateLocation);

    // Click on map to place marker
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      updateLocation();
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update circle visibility when approximate mode changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    if (isApproximate) {
      if (!circleRef.current) {
        const lat = value.latitude ? parseFloat(value.latitude) : 40.4168;
        const lng = value.longitude ? parseFloat(value.longitude) : -3.7038;

        const circle = L.circle([lat, lng], {
          color: "#8B5CF6",
          fillColor: "#A78BFA",
          fillOpacity: 0.2,
          radius: 1000, // 1 km
        }).addTo(mapInstanceRef.current);
        circleRef.current = circle;
      }

      onChange({
        latitude: value.latitude,
        longitude: value.longitude,
        radius: 1,
      });
    } else {
      if (circleRef.current) {
        mapInstanceRef.current.removeLayer(circleRef.current);
        circleRef.current = null;
      }

      onChange({
        latitude: value.latitude,
        longitude: value.longitude,
        radius: 0,
      });
    }
  }, [isApproximate]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold block mb-2">Ubicación en Mapa</Label>
        <p className="text-xs text-muted-foreground mb-3">
          Haz click en el mapa para colocar el pin o arrastra el marcador azul
        </p>

        {/* Map container */}
        <div
          ref={mapRef}
          className="w-full h-64 rounded-md border-2 border-primary/20 mb-4"
          data-testid="map-container"
        />

        {/* Coordinates display */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-md">
          <div>
            <Label className="text-xs font-semibold block mb-1">Latitud</Label>
            <p className="text-sm font-mono text-primary">
              {parseFloat(value.latitude || "40.4168").toFixed(6)}
            </p>
          </div>
          <div>
            <Label className="text-xs font-semibold block mb-1">Longitud</Label>
            <p className="text-sm font-mono text-primary">
              {parseFloat(value.longitude || "-3.7038").toFixed(6)}
            </p>
          </div>
        </div>

        {isApproximate && (
          <div className="mt-2 p-2 bg-secondary/10 rounded-md">
            <p className="text-xs text-secondary font-medium">
              📍 Modo aproximado: Círculo de 1 km
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
