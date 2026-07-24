import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: 'red' | 'blue' | 'green';
}

interface DeliveryMapProps {
  customerMarker?: MapMarker | null;
  driverMarker?: MapMarker | null;
  className?: string;
  showRoute?: boolean;
}

const markerColors: Record<string, string> = {
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
};

function createDivIcon(color: string, label?: string) {
  const html = label
    ? `<div style="display:flex;flex-direction:column;align-items:center;">
         <div style="background:${color};width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
         <div style="margin-top:4px;background:white;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;color:#374151;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.2);">${label}</div>
       </div>`
    : `<div style="background:${color};width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`;
  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}

export function DeliveryMap({ customerMarker, driverMarker, className, showRoute }: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const customerLayerRef = useRef<L.Marker | null>(null);
  const driverLayerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([9.5915, 41.8661], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (customerLayerRef.current) {
      customerLayerRef.current.remove();
      customerLayerRef.current = null;
    }
    if (customerMarker) {
      const color = markerColors[customerMarker.color ?? 'red'];
      customerLayerRef.current = L.marker([customerMarker.lat, customerMarker.lng], {
        icon: createDivIcon(color, customerMarker.label),
      }).addTo(map);
    }

    if (driverLayerRef.current) {
      driverLayerRef.current.remove();
      driverLayerRef.current = null;
    }
    if (driverMarker) {
      const color = markerColors[driverMarker.color ?? 'blue'];
      driverLayerRef.current = L.marker([driverMarker.lat, driverMarker.lng], {
        icon: createDivIcon(color, driverMarker.label),
      }).addTo(map);
    }

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    if (showRoute && customerMarker && driverMarker) {
      routeLayerRef.current = L.polyline(
        [
          [driverMarker.lat, driverMarker.lng],
          [customerMarker.lat, customerMarker.lng],
        ],
        { color: '#dc2626', weight: 3, dashArray: '8 8', opacity: 0.7 }
      ).addTo(map);
    }

    const points: [number, number][] = [];
    if (customerMarker) points.push([customerMarker.lat, customerMarker.lng]);
    if (driverMarker) points.push([driverMarker.lat, driverMarker.lng]);
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points).pad(0.2));
    }

    setTimeout(() => map.invalidateSize(), 50);
  }, [customerMarker, driverMarker, showRoute]);

  return <div ref={containerRef} className={className ?? 'w-full h-full'} />;
}
