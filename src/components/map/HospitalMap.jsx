/**
 * HospitalMap
 * ===========
 * High-level component that fetches hospitals from the backend
 * and renders them on a Mapbox map.
 *
 * This component composes `MapContainer` + `HospitalMarker` and handles:
 *  • Fetching hospital data from `GET /api/hospital`
 *  • Converting hospital documents to map-ready points
 *  • Fitting the map viewport to show all hospitals
 *  • Showing a selected-hospital detail panel
 *
 * Usage:
 *   <HospitalMap />                         — fetches hospitals itself
 *   <HospitalMap hospitals={[...]} />       — uses provided data
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Hospital, MapPin, Loader2 } from "lucide-react";

import MapContainer from "./MapContainer";
import HospitalMarker from "./HospitalMarker";
import { isMapboxConfigured } from "../../config/mapbox";
import { hospitalsToMapPoints, getBounds } from "../../utils/mapUtils";

/**
 * @param {Object}  props
 * @param {Array}   [props.hospitals]  — pre-fetched hospital array (skips fetch)
 * @param {string}  [props.className]  — extra CSS classes on the wrapper
 * @param {number}  [props.height]     — explicit height in px (default: 500)
 */
export default function HospitalMap({ hospitals: externalHospitals, className = "", height = 500 }) {
  const [hospitals, setHospitals] = useState(() => externalHospitals || []);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch hospitals if none provided ────────────────────
  useEffect(() => {
    if (externalHospitals) {
      // hospitals are already initialised from props, nothing to do
      return;
    }

    const fetchHospitals = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          "http://localhost:5000/api/hospital"
        );

        setHospitals(response.data.hospitals || []);
      } catch (err) {
        console.error("HospitalMap: failed to fetch hospitals", err);
        setError("Failed to load hospitals.");
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [externalHospitals]);

  // derive map points from hospitals
  const mapPoints = useMemo(() => hospitalsToMapPoints(hospitals), [hospitals]);

  // ── Fit map to show all hospitals ───────────────────────
  const handleMapLoad = useCallback(
    (map) => {
      if (mapPoints.length === 0) return;

      const bounds = getBounds(mapPoints);
      if (bounds) {
        try {
          map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
        } catch {
          // fitBounds can throw if bounds are invalid
        }
      }
    },
    [mapPoints]
  );

  // ── Token not configured — show placeholder ─────────────
  if (!isMapboxConfigured()) {
    return (
      <div className={className} style={{ height }}>
        <MapContainer.Placeholder />
      </div>
    );
  }

  // ── Loading state ───────────────────────────────────────
  if (loading) {
    return (
      <div
        className={`bg-slate-900 border border-slate-700 rounded-3xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-slate-400">Loading hospitals...</p>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────
  if (error) {
    return (
      <div
        className={`bg-slate-900 border border-slate-700 rounded-3xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <Hospital size={36} className="text-red-500 mx-auto mb-3" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <MapContainer onMapLoad={handleMapLoad}>
        {(map) =>
          mapPoints.map((point) => (
            <HospitalMarker
              key={point.id}
              map={map}
              hospital={point}
              onClick={setSelectedHospital}
            />
          ))
        }
      </MapContainer>

      {/* Selected hospital detail strip */}
      {selectedHospital && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 flex items-center gap-4 z-10">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin size={24} className="text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{selectedHospital.name}</p>
            <p className="text-slate-400 text-sm truncate">{selectedHospital.address || "—"}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-emerald-400 font-medium">
              {selectedHospital.availableBeds} beds
            </p>
            <p className="text-slate-400 text-xs">
              {selectedHospital.availableAmbulances} ambulances
            </p>
          </div>
          <button
            onClick={() => setSelectedHospital(null)}
            className="text-slate-500 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
