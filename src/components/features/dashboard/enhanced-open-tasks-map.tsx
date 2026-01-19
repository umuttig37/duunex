'use client';

import type { DashboardTask } from '@/app/dashboard/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { GoogleMap, InfoWindowF, LoadScriptNext, MarkerF } from '@react-google-maps/api';
import {
  Calendar,
  Clock,
  Euro,
  ExternalLink,
  Layers,
  MapPin,
  Navigation,
  User,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MapLegend,
  getMarkerType,
  getPriorityBadge
} from './enhanced-map-markers';

const getContainerStyle = (isMobile: boolean) => ({
  width: '100%',
  height: isMobile ? '400px' : '600px',
  minHeight: '300px'
});

// Dark mode friendly map styles
const mapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }]
  },
  {
    featureType: 'all',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f5f5f5' }]
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#e5e5e5' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#dadada' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }]
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }]
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [{ color: '#e5e5e5' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c9c9c9' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }]
  }
];

// Helsinki coordinates as default center
const defaultCenter = {
  lat: 60.1699,
  lng: 24.9384
};

const FINLAND_BOUNDS = {
  north: 70.19,
  south: 58.80,
  west: 19.00,
  east: 31.98,
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface TaskerCategory {
  category_id: string;
  categories: {
    id: string;
    name_fi: string;
    name_en: string;
  };
}

interface EnhancedOpenTasksMapProps {
  openTasks: DashboardTask[];
  taskerCategories?: string[];
  isMobile?: boolean;
  userLatitude?: number;
  userLongitude?: number;
  filterByTaskerCategories?: boolean;
  className?: string;
}

// Helper to parse PostGIS point string
const parseCoordinates = (pgPoint: string | null | undefined): { lat: number; lng: number } | null => {
  if (!pgPoint || !pgPoint.startsWith('POINT(')) return null;
  try {
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

// Enhanced marker clustering with offset handling
const addOffsetToOverlappingMarkers = (
  tasks: (DashboardTask & { position: { lat: number; lng: number } })[]
): (DashboardTask & { position: { lat: number; lng: number } })[] => {
  const OFFSET_DISTANCE = 0.002;
  const processedTasks = [...tasks];

  const positionGroups = new Map<string, (DashboardTask & { position: { lat: number; lng: number } })[]>();

  processedTasks.forEach(task => {
    const key = `${task.position.lat.toFixed(6)},${task.position.lng.toFixed(6)}`;
    if (!positionGroups.has(key)) {
      positionGroups.set(key, []);
    }
    positionGroups.get(key)!.push(task);
  });

  positionGroups.forEach((group) => {
    if (group.length > 1) {
      group.forEach((task, index) => {
        if (index > 0) {
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

function EnhancedOpenTasksMapComponent({
  openTasks: allTasks,
  taskerCategories: propTaskerCategories,
  isMobile = false,
  userLatitude,
  userLongitude,
  filterByTaskerCategories = true,
  className = ''
}: EnhancedOpenTasksMapProps) {
  const [selectedTask, setSelectedTask] = useState<(DashboardTask & { position: { lat: number; lng: number } }) | null>(null);
  const [zoom, setZoom] = useState(11);
  const [center, setCenter] = useState({ lat: 60.1695, lng: 24.9354 });
  const [layersVisible, setLayersVisible] = useState(true);
  const [showInfoCard, setShowInfoCard] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchedTaskerCategories, setFetchedTaskerCategories] = useState<string[]>([]);
  
  // Use prop categories if available, otherwise fetch them
  const taskerCategories = propTaskerCategories || fetchedTaskerCategories;

  const mapRef = useRef<google.maps.Map | null>(null);
  const markerIconCache = useRef<Map<string, string>>(new Map());

  // Fetch tasker's categories for filtering only if not provided as prop
  useEffect(() => {
    if (!filterByTaskerCategories || propTaskerCategories) return;

    const fetchTaskerCategories = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data: categories, error } = await supabase
        .from('tasker_categories')
        .select(`
          category_id,
          categories (
            id,
            name_fi,
            name_en
          )
        `)
        .eq('profile_id', user.id);

      if (error) {
        console.error('Error fetching tasker categories:', error);
        return;
      }

      const categoryIds = categories?.map(cat => cat.category_id) || [];
      setFetchedTaskerCategories(categoryIds);
    };

    fetchTaskerCategories();
  }, [filterByTaskerCategories, propTaskerCategories]);

  // Memoize expensive coordinate parsing and task filtering
  const validTasks = useMemo(() => {
    // Guard against undefined or null allTasks
    if (!allTasks || !Array.isArray(allTasks)) {
      return [];
    }

    let filteredTasks = allTasks;

    // Filter by tasker categories if enabled
    if (filterByTaskerCategories && taskerCategories.length > 0) {
      filteredTasks = allTasks.filter(task => {
        // Only show tasks in categories the tasker is qualified for
        return task.category_id && taskerCategories.includes(task.category_id);
      });
    }

    return filteredTasks
      .filter(task => task.latitude && task.longitude)
      .map(task => ({
        ...task,
        position: {
          lat: parseFloat(String(task.latitude)),
          lng: parseFloat(String(task.longitude))
        }
      }))
      .filter(task =>
        task.position &&
        !isNaN(task.position.lat) &&
        !isNaN(task.position.lng)
      ) as (DashboardTask & { position: { lat: number; lng: number } })[];
  }, [allTasks, filterByTaskerCategories, taskerCategories]);

  // Memoize unique marker types calculation
  const visibleMarkerTypes = useMemo(() => {
    const markerTypes = validTasks.map(task => getMarkerType(task, taskerCategories));
    return Array.from(new Set(markerTypes))
      .sort((a, b) => a.priority - b.priority);
  }, [validTasks, taskerCategories]);

  const onMarkerClick = useCallback((task: DashboardTask & { position: { lat: number; lng: number } }) => {
    setSelectedTask(task);
  }, []);

  const onInfoWindowClose = useCallback(() => {
    setSelectedTask(null);
  }, []);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setIsLoading(false);

    if (validTasks.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      validTasks.forEach(task => task.position && bounds.extend(task.position));
      map.fitBounds(bounds);

      const listener = window.google.maps.event.addListener(map, "idle", () => {
        let currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 15) {
          map.setZoom(15);
        }
        if (validTasks.length === 1 && validTasks[0].position) {
          map.setCenter(validTasks[0].position);
          if (!currentZoom || currentZoom > 15) map.setZoom(14);
        }
        window.google.maps.event.removeListener(listener);
      });
    } else {
      map.setCenter(defaultCenter);
      map.setZoom(zoom);
    }
  }, [validTasks, zoom]);

  // Map controls
  const zoomIn = useCallback(() => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 10;
      mapRef.current.setZoom(Math.min(currentZoom + 1, 18));
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 10;
      mapRef.current.setZoom(Math.max(currentZoom - 1, 5));
    }
  }, []);

  const centerOnTasks = useCallback(() => {
    if (mapRef.current && validTasks.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      validTasks.forEach(task => task.position && bounds.extend(task.position));
      mapRef.current.fitBounds(bounds);
    }
  }, [validTasks]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Card className={`border-destructive ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="text-red-500 text-lg font-medium">Google Maps API-avain puuttuu</div>
          <p className="text-gray-600 mt-2">Karttaa ei voi näyttää ilman API-avainta.</p>
        </CardContent>
      </Card>
    );
  }

  if (validTasks.length === 0 && allTasks.length > 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sijaintitiedot puuttuvat</h3>
          <p className="text-gray-600">
            Löytyi {allTasks.length} avointa tehtävää, mutta yhdelläkään ei ole kelvollisia sijaintitietoja.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Helper to safely access google.maps only when available in the browser
  const getGmaps = () => {
    if (typeof window === 'undefined') return null;
    const g = (window as any).google;
    return g && g.maps ? g.maps : null;
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative">
        <LoadScriptNext googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
          <GoogleMap
            mapContainerStyle={getContainerStyle(isMobile)}
            center={center}
            zoom={zoom}
            onLoad={handleMapLoad}
            options={{
              restriction: {
                latLngBounds: FINLAND_BOUNDS,
                strictBounds: true,
              },
              minZoom: 5,
              maxZoom: 18,
              gestureHandling: "cooperative",
              styles: mapStyles,
              disableDefaultUI: true, // Disable default controls to use custom ones
              zoomControl: false,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            }}
          >
            {validTasks.map((task) => {
              const markerType = getMarkerType(task, taskerCategories);

              // Create custom marker icon using canvas with caching for better performance
              const createMarkerIcon = (type: typeof markerType): string | null => {
                // Guard against SSR - only create canvas markers on client-side
                if (typeof window === 'undefined' || typeof document === 'undefined') {
                  return null;
                }

                // Create cache key based on marker type properties
                const cacheKey = `${type.name}-${type.color}-${type.bgColor}-${type.borderColor}-${type.priority}`;

                // Return cached icon if available
                if (markerIconCache.current.has(cacheKey)) {
                  return markerIconCache.current.get(cacheKey)!;
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;
                canvas.width = 50;
                canvas.height = 60;

                // Draw shadow
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.arc(25, 45, 20, 0, Math.PI * 2);
                ctx.fill();

                // Draw main circle
                ctx.fillStyle = type.bgColor;
                ctx.strokeStyle = type.borderColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(25, 25, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Draw icon text
                ctx.fillStyle = type.color;
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(type.icon, 25, 25);

                // Draw priority indicator
                if (type.priority <= 2) {
                  ctx.fillStyle = type.color;
                  ctx.beginPath();
                  ctx.arc(38, 12, 5, 0, Math.PI * 2);
                  ctx.fill();
                }

                const iconUrl = canvas.toDataURL();

                // Cache the icon for future use
                markerIconCache.current.set(cacheKey, iconUrl);

                return iconUrl;
              };

              const customIconUrl = createMarkerIcon(markerType);

              return (
                <MarkerF
                  key={task.id}
                  position={task.position!}
                  onClick={() => onMarkerClick(task)}
                  title={`${task.title} - ${markerType.name}`}
                  icon={customIconUrl ? {
                    url: customIconUrl,
                    scaledSize: getGmaps() ? new (getGmaps() as any).Size(40, 48) : undefined,
                    anchor: getGmaps() ? new (getGmaps() as any).Point(20, 40) : undefined,
                  } : undefined}
                  zIndex={markerType.priority <= 2 ? 1000 : 100}
                />
              );
            })}

            {selectedTask && selectedTask.position && (
              <InfoWindowF
                position={selectedTask.position}
                onCloseClick={onInfoWindowClose}
                options={{ pixelOffset: getGmaps() ? new (getGmaps() as any).Size(0, -40) : undefined }}
              >
                <Card className={`border-none shadow-lg ${isMobile ? 'max-w-xs' : 'max-w-sm'}`}>
                  <CardHeader className={isMobile ? "pb-2 px-3 pt-3" : "pb-3"}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold line-clamp-2 mb-2`}>
                          {selectedTask.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedTask.categories?.name_fi && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedTask.categories.name_fi}
                            </Badge>
                          )}
                          {!isMobile && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: getMarkerType(selectedTask, taskerCategories).color,
                                color: getMarkerType(selectedTask, taskerCategories).color
                              }}
                            >
                              {getPriorityBadge(getMarkerType(selectedTask, taskerCategories))}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className={`space-y-3 ${isMobile ? 'px-3 pb-3' : ''}`}>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 line-clamp-2`}>
                      {selectedTask.description}
                    </p>

                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-1.5' : 'grid-cols-2 gap-3'} text-xs text-gray-600`}>
                      <div className="flex items-center gap-1.5">
                        <Euro className="h-3 w-3" />
                        <span>{selectedTask.budget ? `${selectedTask.budget}€` : 'Ei budjetia'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>
                          {selectedTask.scheduled_date
                            ? (() => {
                              const d = new Date(selectedTask.scheduled_date as unknown as string);
                              const diffH = (d.getTime() - Date.now()) / (1000 * 60 * 60);
                              if (!isNaN(diffH) && diffH <= 72) return 'Kiireellinen';
                              if (!isNaN(diffH) && diffH <= 168) return 'Normaali';
                              return 'Joustava';
                            })()
                            : 'Joustava'}
                        </span>
                      </div>
                      {!isMobile && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3" />
                            <span>{selectedTask.offers_count || 0} tarjousta</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {selectedTask.scheduled_date
                                ? new Date(selectedTask.scheduled_date).toLocaleDateString('fi-FI')
                                : 'Joustavasti'
                              }
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {selectedTask.location_text && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="line-clamp-1">{selectedTask.location_text}</span>
                      </div>
                    )}

                    <Button size="sm" asChild className="w-full">
                      <Link
                        href={`/dashboard/tasks/${selectedTask.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {isMobile ? 'Katso tiedot' : 'Katso tiedot & tee tarjous'}
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </InfoWindowF>
            )}
          </GoogleMap>
        </LoadScriptNext>

        {/* Custom Map Controls Overlay */}
        {/* mapLoaded && ( */}
        <>
          {/* Zoom Controls */}
          <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} flex flex-col gap-1 z-10`}>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "icon"}
              className="bg-white/95 backdrop-blur-sm border shadow-sm hover:bg-white/100"
              onClick={zoomIn}
            >
              <ZoomIn className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            </Button>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "icon"}
              className="bg-white/95 backdrop-blur-sm border shadow-sm hover:bg-white/100"
              onClick={zoomOut}
            >
              <ZoomOut className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            </Button>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "icon"}
              className="bg-white/95 backdrop-blur-sm border shadow-sm hover:bg-white/100"
              onClick={centerOnTasks}
              title="Keskitä kartalla"
            >
              <Navigation className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            </Button>
            {!isMobile && (
              <Button
                variant="outline"
                size="icon"
                className="bg-white/95 backdrop-blur-sm border shadow-sm hover:bg-white/100"
                onClick={() => setLayersVisible(!layersVisible)}
                title="Selitys"
              >
                <Layers className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Map Statistics */}
          <div className={`absolute ${isMobile ? 'top-2 left-2 p-2' : 'top-4 left-4 p-3'} bg-white/95 backdrop-blur-sm rounded-lg border shadow-sm z-10`}>
            <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full bg-emerald-500`}></div>
              <span className="font-medium">
                {isMobile ? `${validTasks.length}` : `${validTasks.length} avointa tehtävää`}
              </span>
            </div>
            {!isMobile && (
              <p className="text-xs text-gray-600 mt-1">
                Klikkaa merkkiä nähdäksesi tiedot
              </p>
            )}
          </div>

          {/* Legend - Only show on desktop or when explicitly toggled */}
          {layersVisible && visibleMarkerTypes.length > 0 && !isMobile && (
            <MapLegend
              visibleTypes={visibleMarkerTypes}
              className="absolute bottom-4 left-4 z-10 max-w-xs"
            />
          )}

          {/* Mobile Legend Toggle */}
          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              className={`absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm border shadow-sm hover:bg-white/100 z-10 ${layersVisible ? 'bg-emerald-50 border-emerald-200' : ''}`}
              onClick={() => setLayersVisible(!layersVisible)}
            >
              <Layers className="h-3 w-3 mr-1" />
              Selitys
            </Button>
          )}

          {/* Mobile Legend Overlay */}
          {layersVisible && visibleMarkerTypes.length > 0 && isMobile && (
            <div className="absolute inset-x-2 bottom-12 z-20">
              <MapLegend
                visibleTypes={visibleMarkerTypes}
                className="w-full"
              />
            </div>
          )}
        </>
        {/* ) */}
      </div>
    </Card>
  );
};

export default memo(EnhancedOpenTasksMapComponent);