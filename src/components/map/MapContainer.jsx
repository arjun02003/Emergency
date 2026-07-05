/**
 * MapContainer
 * ============
 * Reusable base map wrapper for the SURAKSHA project.
 *
 * Responsibilities:
 *  1. Check whether a Mapbox access token is configured.
 *     → If missing, render a friendly placeholder instead of crashing.
 *  2. Initialise the mapbox-gl Map with sensible defaults.
 *  3. Accept children (markers, popups, layers) via props.
 *
 * Usage:
 *   <MapContainer>
 *     <HospitalMarker ... />
 *   </MapContainer>
 */

import { useState, useEffect, useRef } from "react";
import { MAPBOX_ACCESS_TOKEN, isMapboxConfigured, MAPBOX_DEFAULTS } from "../../config/mapbox";
import { MapPin } from "lucide-react";

/**
 * Friendly fallback UI shown when the Mapbox token is not set.
 */
function MapPlaceholder({ message }) {
  return (
    <div className="w-full h-full min-h-[400px] bg-slate-900 border border-slate-700 rounded-3xl flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
        <MapPin size={32} className="text-slate-500" />
      </div>
      <p className="text-slate-400 text-lg font-medium mb-2">
        {message || "Mapbox Access Token not configured."}
      </p>
      <p className="text-slate-500 text-sm max-w-md">
        Add your token to the <code className="bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-300">.env</code> file
        as <code className="bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-300">VITE_MAPBOX_ACCESS_TOKEN</code> and
        restart the dev server.
      </p>
    </div>
  );
}

/**
 * Core map container.
 *
 * @param {Object}   props
 * @param {string}   [props.className]        — additional CSS classes
 * @param {number}   [props.longitude]        — initial centre longitude
 * @param {number}   [props.latitude]         — initial centre latitude
 * @param {number}   [props.zoom]             — initial zoom level
 * @param {string}   [props.mapStyle]         — mapbox style URL
 * @param {Function} [props.onMapLoad]        — called with the map instance when ready
 * @param {React.ReactNode} [props.children]  — markers, popups, etc.
 */
export default function MapContainer({
  className = "",
  longitude,
  latitude,
  zoom,
  mapStyle,
  onMapLoad,
  children,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);


  // ── Initialise map ──────────────────────────────────────
  useEffect(() => {
    if (!isMapboxConfigured()) return;
    // Dynamic import — mapbox-gl is only loaded when a token is present.
    // This means the project builds and runs fine without the package
    // installed; it just shows the placeholder.
    let map;

    const initMap = async () => {
      try {
        const mapboxgl = await import("mapbox-gl");
        await import("mapbox-gl/dist/mapbox-gl.css");

        mapboxgl.default.accessToken = MAPBOX_ACCESS_TOKEN;

        map = new mapboxgl.default.Map({
          container: mapContainerRef.current,
          style: mapStyle || MAPBOX_DEFAULTS.style,
          center: [
            longitude ?? MAPBOX_DEFAULTS.center.longitude,
            latitude ?? MAPBOX_DEFAULTS.center.latitude,
          ],
          zoom: zoom ?? MAPBOX_DEFAULTS.zoom,
        });

        // Standard controls
        map.addControl(new mapboxgl.default.NavigationControl(), "top-right");

        map.on("load", () => {
          mapInstanceRef.current = map;
          setMapInstance(map);
          setMapReady(true);
          if (onMapLoad) onMapLoad(map);
        });
      } catch (err) {
        console.error("MapContainer: failed to initialise Mapbox", err);
        setMapError(
          "Failed to load the map. Make sure mapbox-gl is installed (npm i mapbox-gl)."
        );
      }
    };

    initMap();

    return () => {
      if (map) map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Error state ─────────────────────────────────────────
  if (mapError) {
    return <MapPlaceholder message={mapError} />;
  }

  return (
    <div className={`relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden ${className}`}>
      {/* The map renders into this div */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Children receive the map instance so they can add markers, etc. */}
      {mapReady && mapInstance && (typeof children === "function" ? children(mapInstance) : children)}
    </div>
  );
}

// Re-export the placeholder for consumers that need it standalone
MapContainer.Placeholder = MapPlaceholder;
