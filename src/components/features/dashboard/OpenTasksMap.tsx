'use client';

import type { DashboardTask } from '@/app/dashboard/page'; // Adjust path as necessary
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Removed CardDescription as it's not used for InfoWindow
import { GoogleMap, InfoWindowF, LoadScriptNext, MarkerF } from '@react-google-maps/api';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { memo, useCallback, useState } from 'react';

// Define a default icon URL in case category icon is not available
const DEFAULT_MARKER_ICON_URL = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'; // Standard red marker
// Define a default size for the icons
const MARKER_ICON_SIZE = { width: 32, height: 32 }; // Adjust as needed

const containerStyle = {
  width: '100%',
  height: '520px',
  borderRadius: '16px'
};

// Helsinki coordinates as default center
const defaultCenter = {
  lat: 60.1699, // Helsinki latitude
  lng: 24.9384  // Helsinki longitude
};

const FINLAND_BOUNDS = {
  north: 70.19,
  south: 58.80,
  west: 19.00,
  east: 31.98,
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface OpenTaskMapProps {
  openTasks: DashboardTask[];
}

// Helper to parse PostGIS point string (e.g., "POINT(24.9384 60.1699)") to { lat, lng }
const parseCoordinates = (pgPoint: string | null | undefined): { lat: number; lng: number } | null => {
  if (!pgPoint || !pgPoint.startsWith('POINT(')) return null;
  try {
    // Example: POINT(24.9384 60.1699)
    const coordString = pgPoint.substring(pgPoint.indexOf('(') + 1, pgPoint.indexOf(')'));
    const parts = coordString.split(' ');
    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  } catch (error) {
    console.error("Error parsing coordinates:", pgPoint, error);
    return null;
  }
};

// Helper to add small offsets to overlapping markers
const addOffsetToOverlappingMarkers = (tasks: (DashboardTask & { position: { lat: number; lng: number } })[]): (DashboardTask & { position: { lat: number; lng: number } })[] => {
  const OFFSET_DISTANCE = 0.0020; // Small offset in degrees (~10 meters)
  const processedTasks = [...tasks];

  // Group tasks by their position (rounded to avoid floating point precision issues)
  const positionGroups = new Map<string, (DashboardTask & { position: { lat: number; lng: number } })[]>();

  processedTasks.forEach(task => {
    const key = `${task.position.lat.toFixed(6)},${task.position.lng.toFixed(6)}`;
    if (!positionGroups.has(key)) {
      positionGroups.set(key, []);
    }
    positionGroups.get(key)!.push(task);
  });

  // Apply offsets to overlapping markers
  positionGroups.forEach((group, key) => {
    if (group.length > 1) {
      // Create a circular pattern around the original position
      group.forEach((task, index) => {
        if (index > 0) { // Keep the first marker at original position
          const angle = (2 * Math.PI * index) / group.length;
          const offsetLat = OFFSET_DISTANCE * Math.cos(angle);
          const offsetLng = OFFSET_DISTANCE * Math.sin(angle);

          task.position = {
            lat: task.position.lat + offsetLat,
            lng: task.position.lng + offsetLng
          };
        }
      });
    }
  });

  return processedTasks;
};

const OpenTasksMapComponent: React.FC<OpenTaskMapProps> = ({ openTasks }) => {
  const [selectedTask, setSelectedTask] = useState<DashboardTask & { position: { lat: number; lng: number } } | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(5); // Adjusted initial zoom for Finland view

  console.log("OpenTasksMapComponent received openTasks:", JSON.stringify(openTasks.map(t => ({ id: t.id, coords: t.location_coordinates })), null, 2)); // DEBUG LOG

  const validTasksWithLocation = addOffsetToOverlappingMarkers(
    openTasks
      .map(task => ({
        ...task,
        position: parseCoordinates(task.location_coordinates as string | null)
      }))
      .filter(task => task.position !== null) as (DashboardTask & { position: { lat: number; lng: number } })[]
  );

  const onMarkerClick = useCallback((task: DashboardTask & { position: { lat: number; lng: number } }) => {
    setSelectedTask(task);
    // setMapCenter(task.position); // Optional: center map on selected marker
    // setMapZoom(14); 
  }, []);

  const onInfoWindowClose = useCallback(() => {
    setSelectedTask(null);
  }, []);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    if (validTasksWithLocation.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      validTasksWithLocation.forEach(task => task.position && bounds.extend(task.position));
      map.fitBounds(bounds);

      const listener = window.google.maps.event.addListener(map, "idle", () => {
        let currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 15) {
          map.setZoom(15); // Max zoom to prevent overzooming on single point
        }
        // If only one marker, center and set a reasonable zoom
        if (validTasksWithLocation.length === 1 && validTasksWithLocation[0].position) {
          map.setCenter(validTasksWithLocation[0].position);
          if (!currentZoom || currentZoom > 15) map.setZoom(14); // Default zoom for single marker
        }
        window.google.maps.event.removeListener(listener);
      });
    } else {
      map.setCenter(defaultCenter);
      map.setZoom(mapZoom);
    }
  }, [validTasksWithLocation, mapZoom]); // Added mapZoom to dependencies

  if (!GOOGLE_MAPS_API_KEY) {
    return <div className="text-red-500 p-4 text-center">Google Maps API-avain puuttuu. Karttaa ei voi näyttää.</div>;
  }

  if (validTasksWithLocation.length === 0 && openTasks.length > 0) {
    return <p className="text-gray-600 p-4 text-center">Avoimia tehtäviä löytyi, mutta yhdelläkään ei ole kelvollisia sijaintitietoja kartalla näyttämistä varten.</p>;
  }
  // Note: The case where openTasks itself is empty is handled by the parent component (TaskerDashboardContent)

  return (
    <LoadScriptNext googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter} // center is managed by onLoad logic primarily
        zoom={mapZoom}     // zoom is managed by onLoad logic primarily
        onLoad={handleMapLoad}
        options={{
          restriction: {
            latLngBounds: FINLAND_BOUNDS,
            strictBounds: true,
          },
          minZoom: 5,
          gestureHandling: "cooperative",
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "transit",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "water",
              elementType: "geometry.fill",
              stylers: [{ color: "#e8f4f8" }]
            },
            {
              featureType: "landscape",
              elementType: "geometry.fill",
              stylers: [{ color: "#f8fbf8" }]
            },
            {
              featureType: "road",
              elementType: "geometry.fill",
              stylers: [{ color: "#ffffff" }]
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#e5e7eb" }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        {validTasksWithLocation.map((task) => {
          // Determine the icon URL
          // Assuming task.categories might be null or icon_url might be missing
          const iconUrl = task.categories?.icon_url || DEFAULT_MARKER_ICON_URL;
          // Ensure window.google.maps.Size is available (it should be after LoadScriptNext loads)
          const scaledSize = typeof window !== 'undefined' && window.google && window.google.maps ?
            new window.google.maps.Size(MARKER_ICON_SIZE.width, MARKER_ICON_SIZE.height) :
            undefined; // Fallback, though ideally this shouldn't be hit if map loads

          return (
            // task.position is guaranteed to be non-null here due to the filter
            <MarkerF
              key={task.id}
              position={task.position!}
              onClick={() => onMarkerClick(task)}
              title={task.title || 'Tehtävä'}
              icon={{
                url: iconUrl,
                scaledSize: scaledSize,
              }}
            />
          );
        })}

        {selectedTask && selectedTask.position && (
          <InfoWindowF
            position={selectedTask.position}
            onCloseClick={onInfoWindowClose}
            options={{ pixelOffset: new window.google.maps.Size(0, -35) }} // Adjusted offset slightly
          >
            <Card className="border-none shadow-none w-72 overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">{selectedTask.title}</CardTitle>
                {selectedTask.categories?.name_fi && (
                  <Badge variant="secondary" className="text-xs w-fit bg-emerald-100 text-emerald-700 border-emerald-200">
                    {selectedTask.categories.name_fi}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{selectedTask.description}</p>
                {selectedTask.location_text && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    📍 {selectedTask.location_text}
                  </p>
                )}
                <Button size="sm" asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium">
                  <Link href={`/dashboard/tasks/${selectedTask.id}`} target="_blank" rel="noopener noreferrer">
                    Näytä tehtävä <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </InfoWindowF>
        )}
      </GoogleMap>
    </LoadScriptNext>
  );
};

export default memo(OpenTasksMapComponent); 