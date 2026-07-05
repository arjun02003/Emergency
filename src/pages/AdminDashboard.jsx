import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Users,
  Hospital,
  Activity,
  Plus,
  Eye,
  Edit,
  Trash2,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import { MapContainer } from "../components/map";
import HospitalMarker from "../components/map/HospitalMarker";
import { hospitalsToMapPoints } from "../utils/mapUtils";

const API_BASE_URL = "http://localhost:5000/api";

const statCard = (title, value, icon) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
    <div className="flex items-center justify-between gap-4 mb-4">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{title}</p>
      {icon}
    </div>
    <p className="text-4xl font-semibold text-white">{value}</p>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHospitals: 0,
    hospitalsOnline: 0,
    hospitalsOffline: 0,
    activeSosRequests: 0,
  });
  const [hospitals, setHospitals] = useState([]);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    emergencyTypes: "",
    totalBeds: "",
    availableBeds: "",
    totalAmbulances: "",
    availableAmbulances: "",
  });
  const [selectedHospital, setSelectedHospital] = useState(null);

  const mapPoints = useMemo(() => hospitalsToMapPoints(hospitals), [hospitals]);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Admin authorization missing. Please login again.");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { stats: responseStats, hospitals: responseHospitals, activeEmergencies: responseEmg } = response.data;
      setStats(responseStats || {});
      setHospitals(responseHospitals || []);
      setActiveEmergencies(responseEmg || []);
      setError("");
    } catch (err) {
      console.error("Admin dashboard fetch failed", err);
      setError(err.response?.data?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      await loadDashboard();
    }
    init();
  }, []);

  const updateFormField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      emergencyTypes: "",
      totalBeds: "",
      availableBeds: "",
      totalAmbulances: "",
      availableAmbulances: "",
    });
    setModalError("");
  };

  const handleHospitalSave = async (event) => {
    event.preventDefault();
    setModalError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authorization token missing.");

      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        emergencyTypes: form.emergencyTypes,
        totalBeds: Number(form.totalBeds) || 0,
        availableBeds: Number(form.availableBeds) || 0,
        totalAmbulances: Number(form.totalAmbulances) || 0,
        availableAmbulances: Number(form.availableAmbulances) || 0,
      };

      if (form.password && form.password.trim()) {
        payload.password = form.password.trim();
      }

      if (selectedHospital) {
        await axios.put(`${API_BASE_URL}/admin/hospital/${selectedHospital._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE_URL}/admin/create-hospital`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      resetForm();
      setSelectedHospital(null);
      setShowCreateModal(false);
      loadDashboard();
    } catch (err) {
      console.error("Save hospital failed", err);
      setModalError(err.response?.data?.message || err.message || "Failed to save hospital.");
    }
  };

  const handleDeleteHospital = async (hospitalId) => {
    const confirmed = window.confirm("Delete this hospital permanently?");
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authorization token missing.");

      await axios.delete(`${API_BASE_URL}/admin/hospital/${hospitalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      loadDashboard();
    } catch (err) {
      console.error("Delete hospital failed", err);
      alert(err.response?.data?.message || "Failed to delete hospital.");
    }
  };

  const handleResetPassword = async (hospitalId) => {
    const confirmed = window.confirm("Reset this hospital's password and reveal the new password?");
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authorization token missing.");

      const response = await axios.post(
        `${API_BASE_URL}/admin/hospital/${hospitalId}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Password reset: ${response.data.generatedPassword}`);
    } catch (err) {
      console.error("Reset password failed", err);
      alert(err.response?.data?.message || "Failed to reset password.");
    }
  };

  const handleViewHospital = (hospital) => {
    setSelectedHospital(hospital);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-lg text-slate-300">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="rounded-3xl border border-red-700 bg-red-950/80 p-8 text-center max-w-xl">
          <p className="text-xl font-semibold text-red-400 mb-4">Admin Dashboard Error</p>
          <p className="text-slate-300 mb-6">{error}</p>
          <p className="text-slate-500 text-sm">Log out and log in again if the issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-2">Admin Dashboard</p>
            <h1 className="text-4xl font-semibold">Suraksha Control Panel</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Live hospital management with real MongoDB data and Mapbox visualization.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setSelectedHospital(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
          >
            <Plus className="h-5 w-5" />
            Add Hospital
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {statCard("Total Users", stats.totalUsers, <Users className="h-5 w-5 text-sky-400" />)}
              {statCard("Total Hospitals", stats.totalHospitals, <Hospital className="h-5 w-5 text-emerald-400" />)}
              {statCard("Hospitals Online", stats.hospitalsOnline, <Activity className="h-5 w-5 text-emerald-400" />)}
              {statCard("Hospitals Offline", stats.hospitalsOffline, <Activity className="h-5 w-5 text-amber-400" />)}
              {statCard("Active SOS Requests", stats.activeSosRequests, <AlertTriangle className="h-5 w-5 text-red-400" />)}
            </div>

            <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Hospital Management</h2>
                  <p className="text-sm text-slate-500">Manage hospitals, reset credentials, and delete records.</p>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {hospitals.length} hospitals
                </span>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/80">
                <table className="min-w-full border-separate border-spacing-0 text-left">
                  <thead className="bg-slate-950/90">
                    <tr>
                      <th className="px-5 py-4 text-xs uppercase tracking-[0.25em] text-slate-500">Hospital</th>
                      <th className="px-5 py-4 text-xs uppercase tracking-[0.25em] text-slate-500">Email</th>
                      <th className="px-5 py-4 text-xs uppercase tracking-[0.25em] text-slate-500">Phone</th>
                      <th className="px-5 py-4 text-xs uppercase tracking-[0.25em] text-slate-500">Beds</th>
                      <th className="px-5 py-4 text-xs uppercase tracking-[0.25em] text-slate-500">Ambulances</th>
                      <th className="px-5 py-4 text-xs uppercase tracking-[0.25em] text-slate-500">Status</th>
                      <th className="px-5 py-4 text-xs uppercase tracking-[0.25em] text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitals.map((hospital) => (
                      <tr key={hospital._id} className="border-t border-slate-800 hover:bg-slate-950/80">
                        <td className="px-5 py-4 text-sm text-white">{hospital.name}</td>
                        <td className="px-5 py-4 text-sm text-slate-300">{hospital.email}</td>
                        <td className="px-5 py-4 text-sm text-slate-300">{hospital.phone || "—"}</td>
                        <td className="px-5 py-4 text-sm text-slate-300">{hospital.availableBeds ?? 0}/{hospital.totalBeds ?? 0}</td>
                        <td className="px-5 py-4 text-sm text-slate-300">{hospital.availableAmbulances ?? 0}/{hospital.totalAmbulances ?? 0}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${hospital.isOnline ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700/15 text-slate-400"}`}>
                            {hospital.isOnline ? "Online" : "Offline"}
                          </span>
                        </td>
                        <td className="px-5 py-4 space-x-2">
                          <button
                            onClick={() => handleViewHospital(hospital)}
                            className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                          >
                            <Eye className="inline h-4 w-4 mr-1" /> View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedHospital(hospital);
                              setShowCreateModal(true);
                              setForm({
                                name: hospital.name || "",
                                email: hospital.email || "",
                                phone: hospital.phone || "",
                                address: hospital.address || "",
                                password: "",
                                emergencyTypes: (hospital.emergencyTypes || []).join(", "),
                              });
                            }}
                            className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                          >
                            <Edit className="inline h-4 w-4 mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteHospital(hospital._id)}
                            className="rounded-2xl border border-red-600 bg-red-600/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-600/20"
                          >
                            <Trash2 className="inline h-4 w-4 mr-1" /> Delete
                          </button>
                          <button
                            onClick={() => handleResetPassword(hospital._id)}
                            className="rounded-2xl border border-amber-500 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                          >
                            <KeyRound className="inline h-4 w-4 mr-1" /> Reset
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Hospital Map</h2>
                  <p className="text-sm text-slate-500">Locations for hospitals with valid coordinates.</p>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {mapPoints.length} mapped
                </span>
              </div>
              <div className="h-[420px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                <MapContainer>
                  {(map) =>
                    mapPoints.map((point) => (
                      <HospitalMarker
                        key={point.id}
                        map={map}
                        hospital={point}
                        onClick={() => handleViewHospital(point)}
                      />
                    ))
                  }
                </MapContainer>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Live SOS Monitor</h2>
                  <p className="text-sm text-slate-500">Live events are sourced from backend emergency requests.</p>
                </div>
                <span className="rounded-full bg-red-600/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-red-300">
                  {activeEmergencies.length} active
                </span>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-400">
                {activeEmergencies.length > 0 ? (
                  <div className="grid gap-4">
                    {activeEmergencies.map((emergency) => (
                      <div key={emergency._id} className="rounded-3xl bg-slate-950/80 p-4 border border-slate-800">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">SOS Request</p>
                            <h3 className="text-lg font-semibold text-white">{emergency.user?.name || "Unknown User"}</h3>
                          </div>
                          <span className="rounded-full bg-red-600/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-300">
                            {emergency.status || "Pending"}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-3xl bg-slate-900/80 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Hospital</p>
                            <p className="text-sm text-white">{emergency.assignedHospital?.name || "Not assigned"}</p>
                          </div>
                          <div className="rounded-3xl bg-slate-900/80 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Distance</p>
                            <p className="text-sm text-white">{typeof emergency.distance === "number" ? `${emergency.distance.toFixed(1)} km` : "N/A"}</p>
                          </div>
                          <div className="rounded-3xl bg-slate-900/80 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Phone</p>
                            <p className="text-sm text-white">{emergency.user?.phone || "N/A"}</p>
                          </div>
                          <div className="rounded-3xl bg-slate-900/80 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Requested</p>
                            <p className="text-sm text-white">{new Date(emergency.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl bg-slate-950/80 p-6 border border-slate-800">
                    <p className="text-sm text-slate-400">No active SOS requests right now.</p>
                    <p className="text-sm text-slate-500 mt-2">This panel updates automatically from your backend.</p>
                  </div>
                )}
              </div>
            </section>

            {selectedHospital ? (
              <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
                <h2 className="text-2xl font-semibold">Selected Hospital</h2>
                <p className="text-sm text-slate-500 mb-4">Quick details for the selected location.</p>
                <div className="space-y-4">
                  <div className="rounded-3xl bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="text-lg font-semibold text-white">{selectedHospital.name}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-500">Address</p>
                    <p className="text-sm text-slate-200">{selectedHospital.address || "Not available"}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-900/80 p-4">
                      <p className="text-sm text-slate-500">Beds</p>
                      <p className="text-lg font-semibold text-white">{selectedHospital.availableBeds}/{selectedHospital.totalBeds}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-4">
                      <p className="text-sm text-slate-500">Status</p>
                      <p className="text-lg font-semibold text-white">{selectedHospital.isOnline ? "Online" : "Offline"}</p>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl shadow-black/40">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold">{selectedHospital ? "Edit Hospital" : "Add Hospital"}</h2>
                <p className="text-sm text-slate-500">Create or update hospital records in the system.</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedHospital(null);
                }}
                className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <form className="grid gap-4" onSubmit={handleHospitalSave}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-200">
                  Name
                  <input
                    value={form.name}
                    onChange={(event) => updateFormField("name", event.target.value)}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-200">
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateFormField("email", event.target.value)}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
                    required
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm text-slate-200">
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateFormField("password", event.target.value)}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
                  placeholder={selectedHospital ? "Leave blank to keep existing password" : "Optional hospital password"}
                />
                <p className="text-xs text-slate-500">{selectedHospital ? "Leave blank to keep existing password." : "Optional: set a password for the hospital login."}</p>
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                Phone
                <input
                  value={form.phone}
                  onChange={(event) => updateFormField("phone", event.target.value)}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
                  required
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                Address
                <input
                  value={form.address}
                  onChange={(event) => updateFormField("address", event.target.value)}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
                  required
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-200">
                  Total Beds
                  <input
                    type="number"
                    min="0"
                    value={form.totalBeds}
                    onChange={(event) => updateFormField("totalBeds", event.target.value)}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
                    placeholder="0"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-200">
                  Available Beds
                  <input
                    type="number"
                    min="0"
                    value={form.availableBeds}
                    onChange={(event) => updateFormField("availableBeds", event.target.value)}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
                    placeholder="0"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-200">
                  Total Ambulances
                  <input
                    type="number"
                    min="0"
                    value={form.totalAmbulances}
                    onChange={(event) => updateFormField("totalAmbulances", event.target.value)}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
                    placeholder="0"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-200">
                  Available Ambulances
                  <input
                    type="number"
                    min="0"
                    value={form.availableAmbulances}
                    onChange={(event) => updateFormField("availableAmbulances", event.target.value)}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
                    placeholder="0"
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm text-slate-200">
                Emergency Types
                <input
                  value={form.emergencyTypes}
                  onChange={(event) => updateFormField("emergencyTypes", event.target.value)}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
                  placeholder="e.g. cardiac, trauma"
                />
              </label>
              {modalError ? <p className="text-sm text-red-400">{modalError}</p> : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedHospital(null);
                  }}
                  className="rounded-3xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
                >
                  {selectedHospital ? "Save Changes" : "Create Hospital"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
