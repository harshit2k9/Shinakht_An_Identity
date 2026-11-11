import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface SafeZone {
  id: string;
  name: string;
  nameHi: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  color: string;
}

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
  outsideZone: boolean;
}

interface MapModuleProps {
  onAlert: (message: string, type: 'warning' | 'danger') => void;
}

const DEFAULT_ZONES: SafeZone[] = [
  { id: '1', name: 'Home', nameHi: 'घर', lat: 28.6139, lng: 77.2090, radius: 200, color: '#22c55e' },
  { id: '2', name: 'Temple', nameHi: 'मंदिर', lat: 28.6219, lng: 77.2130, radius: 150, color: '#f59e0b' },
  { id: '3', name: 'Park', nameHi: 'पार्क', lat: 28.6080, lng: 77.2150, radius: 180, color: '#3b82f6' },
];

function LocationTracker({ onLocationUpdate }: { onLocationUpdate: (point: LocationPoint) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onLocationUpdate({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        timestamp: Date.now(),
        outsideZone: false,
      });
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>Current Position<br />Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}</Popup>
    </Marker>
  ) : null;
}

export default function MapModule({ onAlert }: MapModuleProps) {
  const [zones, setZones] = useState<SafeZone[]>(() => {
    const saved = localStorage.getItem('shinakht_safe_zones');
    return saved ? JSON.parse(saved) : DEFAULT_ZONES;
  });
  const [trail, setTrail] = useState<LocationPoint[]>([]);
  const [outsideCount, setOutsideCount] = useState(0);
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneNameHi, setNewZoneNameHi] = useState('');
  const [newZoneRadius, setNewZoneRadius] = useState(200);
  const [simulating, setSimulating] = useState(false);
  const simIntervalRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('shinakht_safe_zones', JSON.stringify(zones));
  }, [zones]);

  const isInsideAnyZone = (lat: number, lng: number): boolean => {
    return zones.some(zone => {
      const R = 6371000; // Earth's radius in meters
      const dLat = (zone.lat - lat) * Math.PI / 180;
      const dLng = (zone.lng - lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(zone.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance <= zone.radius;
    });
  };

  const handleLocationUpdate = (point: LocationPoint) => {
    const inside = isInsideAnyZone(point.lat, point.lng);
    const updatedPoint = { ...point, outsideZone: !inside };
    setTrail(prev => [...prev.slice(-50), updatedPoint]);

    if (!inside) {
      const newCount = outsideCount + 1;
      setOutsideCount(newCount);
      if (newCount >= 2) {
        onAlert('⚠️ User is outside safe zones (2+ consecutive pings). Please check location immediately!', 'danger');
      } else {
        onAlert('User moved outside a safe zone. Monitoring...', 'warning');
      }
    } else {
      setOutsideCount(0);
    }
  };

  const addZone = (lat: number, lng: number) => {
    if (!newZoneName.trim()) return;
    const colors = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];
    const newZone: SafeZone = {
      id: Date.now().toString(),
      name: newZoneName,
      nameHi: newZoneNameHi || newZoneName,
      lat,
      lng,
      radius: newZoneRadius,
      color: colors[zones.length % colors.length],
    };
    setZones([...zones, newZone]);
    setNewZoneName('');
    setNewZoneNameHi('');
    setIsAddingZone(false);
  };

  const removeZone = (id: string) => {
    setZones(zones.filter(z => z.id !== id));
  };

  const simulateMovement = () => {
    if (simulating) {
      clearInterval(simIntervalRef.current);
      setSimulating(false);
      return;
    }
    setSimulating(true);
    let step = 0;
    const baseLat = 28.6139;
    const baseLng = 77.2090;

    simIntervalRef.current = setInterval(() => {
      step++;
      // Simulate moving away from home
      const lat = baseLat + (step * 0.002);
      const lng = baseLng + (step * 0.001);
      handleLocationUpdate({ lat, lng, timestamp: Date.now(), outsideZone: false });
      if (step > 10) {
        clearInterval(simIntervalRef.current);
        setSimulating(false);
      }
    }, 1500);
  };

  const center: [number, number] = [28.6139, 77.2090];

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="p-3 bg-white border-b space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">📍 Location Safety</h3>
          <div className="flex gap-2">
            <button
              onClick={simulateMovement}
              className={`text-xs px-3 py-1.5 rounded-full ${simulating ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
            >
              {simulating ? '⏹ Stop' : '▶ Simulate'}
            </button>
            <button
              onClick={() => setIsAddingZone(!isAddingZone)}
              className="text-xs px-3 py-1.5 rounded-full bg-green-100 text-green-700"
            >
              + Add Zone
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-3 text-xs">
          <span className="bg-gray-100 px-2 py-1 rounded">
            Zones: <strong>{zones.length}</strong>
          </span>
          <span className="bg-gray-100 px-2 py-1 rounded">
            Trail: <strong>{trail.length}</strong> points
          </span>
          <span className={`px-2 py-1 rounded ${outsideCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {outsideCount > 0 ? `⚠️ Outside (${outsideCount})` : '✅ In Zone'}
          </span>
        </div>

        {/* Add Zone Form */}
        {isAddingZone && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-green-800">Tap on the map to place a new safe zone</p>
            <div className="flex gap-2">
              <input
                value={newZoneName}
                onChange={e => setNewZoneName(e.target.value)}
                placeholder="Zone name (e.g., Home)"
                className="flex-1 px-2 py-1 border rounded text-sm"
              />
              <input
                value={newZoneNameHi}
                onChange={e => setNewZoneNameHi(e.target.value)}
                placeholder="हिंदी नाम"
                className="flex-1 px-2 py-1 border rounded text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Radius (m):</label>
              <input
                type="range"
                min={50}
                max={500}
                value={newZoneRadius}
                onChange={e => setNewZoneRadius(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs font-medium">{newZoneRadius}m</span>
            </div>
          </div>
        )}

        {/* Zone List */}
        <div className="flex flex-wrap gap-2">
          {zones.map(zone => (
            <span
              key={zone.id}
              className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }}></span>
              {zone.name} ({zone.nameHi})
              <button onClick={() => removeZone(zone.id)} className="text-red-400 hover:text-red-600 ml-1">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={center} zoom={15} className="h-full w-full z-0" style={{ minHeight: '350px' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {zones.map(zone => (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={zone.radius}
              pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.15 }}
            >
              <Popup>
                <strong>{zone.name}</strong> ({zone.nameHi})<br />
                Radius: {zone.radius}m
              </Popup>
            </Circle>
          ))}
          {trail.length > 1 && (
            <Polyline
              positions={trail.map(p => [p.lat, p.lng])}
              pathOptions={{
                color: trail[trail.length - 1]?.outsideZone ? '#ef4444' : '#3b82f6',
                weight: 3,
                dashArray: '5, 10',
              }}
            />
          )}
          <LocationTracker onLocationUpdate={handleLocationUpdate} />
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg p-2 text-xs shadow z-[1000]">
          <p className="font-medium mb-1">Map Legend</p>
          <p>🟢 Safe Zone (Circle)</p>
          <p>📍 Tap to add location</p>
          <p>🔵 Movement trail</p>
        </div>
      </div>
    </div>
  );
}
