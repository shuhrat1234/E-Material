import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { OLMAZOR_MAHALLAS } from '../../data/olmazorMahallas';
import { OLMAZOR_BOUNDARY, OLMAZOR_BOUNDS } from '../../data/olmazorBoundary';
import { useSettings } from '../../settingsContext';

// ~1km padding around the district outline so edge mahallas aren't clipped by the view.
const PAD = 0.01;

// Outer world ring masking everything outside Olmazor
const WORLD_MASK_OUTER = [[-85, -180], [-85, 180], [85, 180], [85, -180]];

// Internal controller component for smooth programmatic camera movements
function MapViewController({ focusLocation, resetTrigger, bounds }) {
  const map = useMap();

  useEffect(() => {
    // Force Leaflet to recalculate dimensions after DOM layout settles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (!focusLocation) return;
    const lat = Array.isArray(focusLocation) ? focusLocation[0] : focusLocation.lat;
    const lon = Array.isArray(focusLocation) ? focusLocation[1] : focusLocation.lon;
    const zoom = focusLocation.zoom || 15;
    if (lat && lon) {
      map.flyTo([lat, lon], zoom, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [focusLocation, map]);

  useEffect(() => {
    if (!resetTrigger) return;
    map.flyToBounds(bounds, {
      padding: [20, 20],
      duration: 1.0,
    });
  }, [resetTrigger, bounds, map]);

  return null;
}

function MahallaMap({
  getMarkerProps = () => null,
  onMarkerClick,
  renderMarker,
  overlayLayers,
  height = '420px',
  scrollWheelZoom = true,
  dragging = true,
  zoomControl = true,
  doubleClickZoom = true,
  className = '',
  mapType = 'carto', // 'carto' | 'streets' | 'satellite'
  focusLocation = null,
  resetTrigger = null,
}) {
  const { isDark } = useSettings();

  const bounds = useMemo(() => [
    [OLMAZOR_BOUNDS.south - PAD, OLMAZOR_BOUNDS.west - PAD],
    [OLMAZOR_BOUNDS.north + PAD, OLMAZOR_BOUNDS.east + PAD],
  ], []);

  // Multi-basemap support
  const tileConfig = useMemo(() => {
    if (mapType === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri &mdash; Earthstar Geographics',
        bg: '#0b1220',
      };
    }
    if (mapType === 'streets') {
      return {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        bg: '#e2e8f0',
      };
    }
    // Default Carto Minimalist (No POI / clean vector look)
    return isDark
      ? {
        url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        bg: '#0b1220',
      }
      : {
        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        bg: '#eef2f7',
      };
  }, [mapType, isDark]);

  const maskFillColor = mapType === 'satellite' ? '#070b14' : tileConfig.bg;
  const boundaryBorderColor = mapType === 'satellite' ? '#38bdf8' : (isDark ? '#5598e7' : '#2563eb');

  return (
    <div className={`relative isolate rounded-xl overflow-hidden border border-gov-border w-full min-w-0 ${className}`} style={{ height, minHeight: height }}>
      <MapContainer
        bounds={bounds}
        maxBounds={bounds}
        maxBoundsViscosity={0.9}
        minZoom={12}
        scrollWheelZoom={scrollWheelZoom}
        dragging={dragging}
        zoomControl={zoomControl}
        doubleClickZoom={doubleClickZoom}
        style={{ height: '100%', width: '100%', background: tileConfig.bg }}
      >
        <TileLayer url={tileConfig.url} attribution={tileConfig.attribution} />
        <MapViewController focusLocation={focusLocation} resetTrigger={resetTrigger} bounds={bounds} />

        {overlayLayers}

        {/* Mask out areas outside Olmazor */}
        <Polygon
          interactive={false}
          positions={[WORLD_MASK_OUTER, OLMAZOR_BOUNDARY]}
          pathOptions={{
            stroke: false,
            fillColor: maskFillColor,
            fillOpacity: mapType === 'satellite' ? 0.88 : 1,
          }}
        />

        {/* Highlighted Olmazor district boundary */}
        <Polygon
          interactive={false}
          positions={OLMAZOR_BOUNDARY}
          pathOptions={{
            color: boundaryBorderColor,
            weight: 2.5,
            dashArray: mapType === 'satellite' ? '6, 6' : undefined,
            fillOpacity: 0,
          }}
        />

        {OLMAZOR_MAHALLAS.map(m => {
          const props = getMarkerProps(m);
          if (!props) return null;
          if (renderMarker) return renderMarker(m, props, onMarkerClick);
          const { tooltip, radius, ...pathOptions } = props;
          return (
            <CircleMarker
              key={m.id}
              center={[m.lat, m.lon]}
              radius={radius ?? 7}
              pathOptions={pathOptions}
              eventHandlers={onMarkerClick ? { click: () => onMarkerClick(m) } : undefined}
            >
              {tooltip && <Tooltip direction="top" offset={[0, -4]}>{tooltip}</Tooltip>}
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default MahallaMap;
