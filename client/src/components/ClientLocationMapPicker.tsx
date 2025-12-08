import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Label } from "@/components/ui/label";

interface LocationData {
  latitude: string;
  longitude: string;
  radius: number;
}

interface ClientLocationMapPickerProps {
  value: LocationData;
  onChange: (data: LocationData) => void;
}

export default function ClientLocationMapPicker({ value, onChange }: ClientLocationMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultLat = value.latitude ? parseFloat(value.latitude) : 40.4168;
    const defaultLng = value.longitude ? parseFloat(value.longitude) : -3.7038;

    const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

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

    // Add circle (1 km default for client)
    const circle = L.circle([defaultLat, defaultLng], {
      color: "#3B82F6",
      fillColor: "#60A5FA",
      fillOpacity: 0.2,
      radius: 1000, // 1 km
    }).addTo(map);
    circleRef.current = circle;

    const updateLocation = () => {
      const lat = marker.getLatLng().lat;
      const lng = marker.getLatLng().lng;
      onChange({
        latitude: lat.toString(),
        longitude: lng.toString(),
        radius: 1,
      });

      if (circleRef.current) {
        circleRef.current.setLatLng([lat, lng]);
      }
    };

    marker.on("dragend", updateLocation);
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      updateLocation();
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold block">Ubicación en Mapa</Label>
      <p className="text-xs text-muted-foreground">
        Click en el mapa o arrastra el marcador. Se mostrará un círculo de 1 km.
      </p>

      <div
        ref={mapRef}
        className="w-full h-48 rounded-md border-2 border-primary/20"
        data-testid="client-map-container"
      />

      <div className="grid grid-cols-2 gap-2 p-2 bg-muted/30 rounded-md text-xs">
        <div>
          <Label className="text-xs font-semibold block mb-1">Latitud</Label>
          <p className="font-mono text-primary">{parseFloat(value.latitude || "40.4168").toFixed(6)}</p>
        </div>
        <div>
          <Label className="text-xs font-semibold block mb-1">Longitud</Label>
          <p className="font-mono text-primary">{parseFloat(value.longitude || "-3.7038").toFixed(6)}</p>
        </div>
      </div>
    </div>
  );
}
