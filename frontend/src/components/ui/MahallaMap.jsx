import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { OLMAZOR_MAHALLAS } from '../../data/olmazorMahallas';
import { OLMAZOR_BOUNDARY, OLMAZOR_BOUNDS } from '../../data/olmazorBoundary';
import { useSettings } from '../../settingsContext';

// ~1km padding around the district outline so edge mahallas aren't clipped by the view.
const PAD = 0.01;

// A large outer ring with the district cut out as a hole (Leaflet fills polygons
// even-odd) — paints over everything *outside* Olmazor tumani so only the district
// itself is legible, per request to not show the rest of Tashkent around it.
const WORLD_MASK_OUTER = [[-85, -180], [-85, 180], [85, 180], [85, -180]];

// Renders the real Olmazor tumani outline plus one marker per mahalla (both sourced
// from OpenStreetMap, see src/data/). Pan/zoom is clamped to the district via maxBounds,
// and everything outside the district is masked out so it doesn't compete for attention.
// Marker appearance is fully delegated to getMarkerProps so the crime map (bubbles sized
// by case count) and the registration-form picker (simple selectable pins) can share this.
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
}) {
  const { isDark } = useSettings();

  const bounds = useMemo(() => [
    [OLMAZOR_BOUNDS.south - PAD, OLMAZOR_BOUNDS.west - PAD],
    [OLMAZOR_BOUNDS.north + PAD, OLMAZOR_BOUNDS.east + PAD],
  ], []);

  // Muted CARTO basemaps (no labels/POI clutter) so the mahalla borders and fills
  // read clearly instead of competing with a busy standard OSM tile.
  const tile = isDark
    ? {
      url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }
    : {
      url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    };
  const mapBg = isDark ? '#0b1220' : '#eef2f7';

  return (
    <div className={`rounded-xl overflow-hidden border border-gov-border ${className}`} style={{ height }}>
      <MapContainer
        bounds={bounds}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        minZoom={12}
        scrollWheelZoom={scrollWheelZoom}
        dragging={dragging}
        zoomControl={zoomControl}
        doubleClickZoom={doubleClickZoom}
        style={{ height: '100%', width: '100%', background: mapBg }}
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />
        {overlayLayers}
        <Polygon
          positions={[WORLD_MASK_OUTER, OLMAZOR_BOUNDARY]}
          pathOptions={{ stroke: false, fillColor: mapBg, fillOpacity: 1, interactive: false }}
        />
        <Polygon
          positions={OLMAZOR_BOUNDARY}
          pathOptions={{ color: isDark ? '#5598e7' : '#2a78d6', weight: 2, fillOpacity: 0, interactive: false }}
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
