import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapProps {
  onPolygonCreated: (polygon: any) => void;
}

const Map: React.FC<MapProps> = ({ onPolygonCreated }) => {
  const mapRef = useRef<L.Map>(null);

  const _onCreated = (e: any) => {
    const { layerType, layer } = e;
    if (layerType === 'polygon' || layerType === 'rectangle') {
      const coords = layer.getLatLngs();
      onPolygonCreated(coords);
    }
  };

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden shadow-lg border-4 border-white">
      <MapContainer
        center={[15.3173, 75.7139]} // Karnataka, India (Paddy fields region)
        zoom={13}
        scrollWheelZoom={false}
        ref={mapRef}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FeatureGroup>
          <EditControl
            position="topright"
            onCreated={_onCreated}
            draw={{
              rectangle: true,
              polyline: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polygon: true,
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};

export default Map;
