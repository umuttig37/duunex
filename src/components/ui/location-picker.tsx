import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue in Leaflet with Webpack/Next.js
import L from 'leaflet';
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  value?: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: string;
}

export function LocationPicker({ value, onChange, height = '300px' }: LocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(value || null);

  function LocationMarker() {
    useMapEvents({      click(e: any) {
        setPosition(e.latlng);
        onChange(e.latlng);
      },
    });
    return position ? <Marker position={position} /> : null;
  }

  return (    <MapContainer
      center={position || { lat: 60.1699, lng: 24.9384 }} // Default: Helsinki
      zoom={12}
      style={{ height, width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        // @ts-ignore
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker />
    </MapContainer>
  );
}

// Blueprint alignment: This component enables map-based location selection, supporting geospatial features as required by Section 2 and Section 4 of the blueprint.
