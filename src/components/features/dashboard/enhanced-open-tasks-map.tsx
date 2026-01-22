'use client';

import type { DashboardTask } from '@/app/dashboard/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
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

// Leaflet imports
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Fix for default marker icon issue in Leaflet with Webpack/Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const getContainerStyle = (isMobile: boolean) => ({
  width: '100%',
  height: isMobile ? '400px' : '600px',
  minHeight: '300px'
});

// Helsinki coordinates as default center
const defaultCenter: [number, number] = [60.1699, 24.9384];

// Finland bounds for limiting the map view
const FINLAND_BOUNDS: L.LatLngBoundsExpression = [
  [58.80, 19.00], // Southwest
  [70.19, 31.98]  // Northeast
];

interface EnhancedOpenTasksMapProps {
  openTasks: DashboardTask[];
  taskerCategories?: string[];
  isMobile?: boolean;
  userLatitude?: number;
  userLongitude?: number;
  filterByTaskerCategories?: boolean;
  className?: string;
}

// Create custom divIcon for markers based on marker type
const createCustomIcon = (markerType: { 
  color: string; 
  bgColor: string; 
  borderColor: string; 
  icon: string;
  priority: number;
}): L.DivIcon => {
  const showPriorityDot = markerType.priority <= 2;
  
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: ${markerType.bgColor};
          border: 3px solid ${markerType.borderColor};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          font-size: 14px;
        ">${markerType.icon}</div>
        ${showPriorityDot ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: ${markerType.color};
            border: 2px solid white;
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

// Map controller component for zoom and navigation
function MapController({ 
  validTasks, 
  mapRef 
}: { 
  validTasks: { position: [number, number] }[];
  mapRef: React.MutableRefObject<L.Map | null>;
}) {
  const map = useMap();
  
  useEffect(() => {
    mapRef.current = map;
    
    if (validTasks.length > 0) {
      const bounds = L.latLngBounds(validTasks.map(t => t.position));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      
      if (validTasks.length === 1) {
        map.setView(validTasks[0].position, 14);
      }
    }
  }, [map, validTasks, mapRef]);
  
  return null;
}

function EnhancedOpenTasksMapComponent({
  openTasks: allTasks,
  taskerCategories: propTaskerCategories,
  isMobile = false,
  userLatitude,
  userLongitude,
  filterByTaskerCategories = true,
  className = ''
}: EnhancedOpenTasksMapProps) {
  const [layersVisible, setLayersVisible] = useState(true);
  const [fetchedTaskerCategories, setFetchedTaskerCategories] = useState<string[]>([]);
  
  // Use prop categories if available, otherwise fetch them
  const taskerCategories = propTaskerCategories || fetchedTaskerCategories;

  const mapRef = useRef<L.Map | null>(null);
  const markerIconCache = useRef<Map<string, L.DivIcon>>(new Map());

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
        position: [
          parseFloat(String(task.latitude)),
          parseFloat(String(task.longitude))
        ] as [number, number]
      }))
      .filter(task =>
        task.position &&
        !isNaN(task.position[0]) &&
        !isNaN(task.position[1])
      );
  }, [allTasks, filterByTaskerCategories, taskerCategories]);

  // Memoize unique marker types calculation
  const visibleMarkerTypes = useMemo(() => {
    const markerTypes = validTasks.map(task => getMarkerType(task, taskerCategories));
    return Array.from(new Set(markerTypes))
      .sort((a, b) => a.priority - b.priority);
  }, [validTasks, taskerCategories]);

  // Get cached or create new marker icon
  const getMarkerIcon = useCallback((markerType: ReturnType<typeof getMarkerType>): L.DivIcon => {
    const cacheKey = `${markerType.name}-${markerType.color}-${markerType.bgColor}-${markerType.borderColor}-${markerType.priority}`;
    
    if (markerIconCache.current.has(cacheKey)) {
      return markerIconCache.current.get(cacheKey)!;
    }
    
    const icon = createCustomIcon(markerType);
    markerIconCache.current.set(cacheKey, icon);
    return icon;
  }, []);

  // Map controls
  const zoomIn = useCallback(() => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.setZoom(Math.min(currentZoom + 1, 18));
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.setZoom(Math.max(currentZoom - 1, 5));
    }
  }, []);

  const centerOnTasks = useCallback(() => {
    if (mapRef.current && validTasks.length > 0) {
      const bounds = L.latLngBounds(validTasks.map(t => t.position));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [validTasks]);

  if (validTasks.length === 0 && allTasks && allTasks.length > 0) {
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

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative">
        <MapContainer
          center={defaultCenter}
          zoom={11}
          style={getContainerStyle(isMobile)}
          scrollWheelZoom={true}
          maxBounds={FINLAND_BOUNDS}
          minZoom={5}
          maxZoom={18}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController validTasks={validTasks} mapRef={mapRef} />
          
          {validTasks.map((task) => {
            const markerType = getMarkerType(task, taskerCategories);
            const icon = getMarkerIcon(markerType);

            return (
              <Marker
                key={task.id}
                position={task.position}
                icon={icon}
              >
                <Popup maxWidth={isMobile ? 280 : 350} closeButton={true}>
                  <div className={`${isMobile ? 'p-1' : 'p-2'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold line-clamp-2 mb-2`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {task.categories?.name_fi && (
                            <Badge variant="secondary" className="text-xs">
                              {task.categories.name_fi}
                            </Badge>
                          )}
                          {!isMobile && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: markerType.color,
                                color: markerType.color
                              }}
                            >
                              {getPriorityBadge(markerType)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 line-clamp-2 mb-3`}>
                      {task.description}
                    </p>

                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-1.5' : 'grid-cols-2 gap-3'} text-xs text-gray-600 mb-3`}>
                      <div className="flex items-center gap-1.5">
                        <Euro className="h-3 w-3" />
                        <span>{task.budget ? `${task.budget}€` : 'Ei budjetia'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>
                          {task.scheduled_date
                            ? (() => {
                              const d = new Date(task.scheduled_date as unknown as string);
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
                            <span>{task.offers_count || 0} tarjousta</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {task.scheduled_date
                                ? new Date(task.scheduled_date).toLocaleDateString('fi-FI')
                                : 'Joustavasti'
                              }
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {task.location_text && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="line-clamp-1">{task.location_text}</span>
                      </div>
                    )}

                    <Button size="sm" asChild className="w-full">
                      <Link
                        href={`/dashboard/tasks/${task.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {isMobile ? 'Katso tiedot' : 'Katso tiedot & tee tarjous'}
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Custom Map Controls Overlay */}
        <>
          {/* Zoom Controls */}
          <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} flex flex-col gap-1 z-[1000]`}>
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
          <div className={`absolute ${isMobile ? 'top-2 left-2 p-2' : 'top-4 left-4 p-3'} bg-white/95 backdrop-blur-sm rounded-lg border shadow-sm z-[1000]`}>
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
              className="absolute bottom-4 left-4 z-[1000] max-w-xs"
            />
          )}

          {/* Mobile Legend Toggle */}
          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              className={`absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm border shadow-sm hover:bg-white/100 z-[1000] ${layersVisible ? 'bg-emerald-50 border-emerald-200' : ''}`}
              onClick={() => setLayersVisible(!layersVisible)}
            >
              <Layers className="h-3 w-3 mr-1" />
              Selitys
            </Button>
          )}

          {/* Mobile Legend Overlay */}
          {layersVisible && visibleMarkerTypes.length > 0 && isMobile && (
            <div className="absolute inset-x-2 bottom-12 z-[1001]">
              <MapLegend
                visibleTypes={visibleMarkerTypes}
                className="w-full"
              />
            </div>
          )}
        </>
      </div>
    </Card>
  );
}

export default memo(EnhancedOpenTasksMapComponent);
