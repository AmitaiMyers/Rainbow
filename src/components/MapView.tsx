import L from 'leaflet';
import { useMemo } from 'react';
import { CircleMarker, LayerGroup, LayersControl, MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import type { AsyncState } from '../lib/asyncState';
import { useWorldRainbow, type CityEstimate } from '../hooks/useWorldRainbow';
import type { FeedPhoto } from '../lib/feed';
import type { LatLon } from '../lib/geo';
import { scoreClass } from './ScoreCard';

const SCORE_COLORS: Record<string, string> = {
  high: '#a855f7',
  medium: '#f97316',
  low: '#eab308',
  none: '#94a3b8',
};
const WORLD_CENTER: [number, number] = [20, 0];

function photoIcon(thumb: string): L.DivIcon {
  // Built as a DOM node (not an HTML string) so photo data can never inject markup.
  const img = document.createElement('img');
  img.src = thumb;
  img.alt = 'Rainbow photo';
  return L.divIcon({ html: img, className: 'photo-pin', iconSize: [44, 44], iconAnchor: [22, 22] });
}

function PhotoPin({ photo, onSelect }: { photo: FeedPhoto; onSelect: (photo: FeedPhoto) => void }) {
  const icon = useMemo(() => photoIcon(photo.thumb), [photo.thumb]);
  return <Marker position={[photo.lat, photo.lon]} icon={icon} eventHandlers={{ click: () => onSelect(photo) }} />;
}

function CityDot({ item }: { item: CityEstimate }) {
  const { city, estimate } = item;
  const color = SCORE_COLORS[scoreClass(estimate.score)];
  return (
    <CircleMarker
      center={[city.lat, city.lon]}
      radius={5 + estimate.score / 10}
      pathOptions={{ color, fillColor: color, fillOpacity: estimate.score > 0 ? 0.7 : 0.25, weight: 1 }}
    >
      <Tooltip>
        <strong>{city.name}</strong>: rainbow chance {estimate.score}
        <br />
        Sun {estimate.sunElevationDeg.toFixed(0)}° · look {estimate.lookLabel}
      </Tooltip>
    </CircleMarker>
  );
}

function worldStatus(world: AsyncState<CityEstimate[]>): string {
  switch (world.status) {
    case 'idle':
    case 'loading':
      return 'Calculating rainbow chance around the world…';
    case 'error':
      return `World layer failed: ${world.message}`;
    case 'ok': {
      const likely = world.value.filter((c) => c.estimate.score > 0).length;
      return `${likely} of ${world.value.length} cities have some rainbow chance right now (updates every 15 min).`;
    }
  }
}

interface Props {
  readonly photos: readonly FeedPhoto[];
  readonly position: LatLon | null;
  readonly onSelectPhoto: (photo: FeedPhoto) => void;
}

export function MapView({ photos, position, onSelectPhoto }: Props) {
  const world = useWorldRainbow(true);
  const center: [number, number] = position === null ? WORLD_CENTER : [position.lat, position.lon];

  return (
    <div className="view map">
      <MapContainer center={center} zoom={position === null ? 2 : 3} worldCopyJump className="leaflet-host">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LayersControl position="topright">
          <LayersControl.Overlay checked name="Rainbow chance (cities)">
            <LayerGroup>
              {world.status === 'ok' && world.value.map((item) => <CityDot key={item.city.name} item={item} />)}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Rainbow photos (24 h)">
            <LayerGroup>
              {photos.map((photo) => <PhotoPin key={photo.id} photo={photo} onSelect={onSelectPhoto} />)}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
        {position !== null && (
          <CircleMarker center={[position.lat, position.lon]} radius={7} pathOptions={{ color: '#2563eb', fillOpacity: 1 }}>
            <Tooltip>You are here</Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
      <div className="map-legend">
        <span><i style={{ background: SCORE_COLORS['high'] }} />High</span>
        <span><i style={{ background: SCORE_COLORS['medium'] }} />Medium</span>
        <span><i style={{ background: SCORE_COLORS['low'] }} />Low</span>
        <span><i style={{ background: SCORE_COLORS['none'] }} />None</span>
        <p>{worldStatus(world)}</p>
      </div>
    </div>
  );
}
