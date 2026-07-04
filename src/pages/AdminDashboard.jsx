import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Users,
  Hospital,
  AlertTriangle,
  Ambulance,
  LogOut,
  Shield,
  Plus,
  Eye,
  Pencil,
  Trash2,
  KeyRound,
  MapPin,
} from "lucide-react";
import { HospitalMap } from "../components/map";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      totalHospitals: 0,
      hospitalsOnline: 0,
      hospitalsOffline: 0,
      activeSosRequests: 0,
    },
    hospitals: [],
    activeEmergencies: [],
  });
  const [loading, setLoading] = useState(true);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    emergencyTypes: "",
  });
  const [isEditingHospital, setIsEditingHospital] = useState(false);
  const [editingHospitalId, setEditingHospitalId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [generatePassword, setGeneratePassword] = useState(true);
  const [isSubmittingHospital, setIsSubmittingHospital] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordToShow, setPasswordToShow] = useState("");
  const [hospitalFormError, setHospitalFormError] = useState("");

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDashboardData({
        stats: response.data.stats || {
          totalUsers: 0,
          totalHospitals: 0,
          hospitalsOnline: 0,
          hospitalsOffline: 0,
          activeSosRequests: 0,
        },
        hospitals: response.data.hospitals || [],
        activeEmergencies: response.data.activeEmergencies || [],
      });
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      showSuccessToast("Unable to load dashboard data right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleHospitalChange = (e) => {
    const { name, value } = e.target;
    setHospitalForm((prev) => ({ ...prev, [name]: value }));
    if (hospitalFormError) {
      setHospitalFormError("");
    }
  };

  const validateHospitalForm = () => {
    const name = hospitalForm.name.trim();
    const email = hospitalForm.email.trim();
    const password = hospitalForm.password.trim();
    const phone = hospitalForm.phone.trim();
    const address = hospitalForm.address.trim();
    const emergencyTypes = hospitalForm.emergencyTypes
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!name || !email || !phone || !address || emergencyTypes.length === 0) {
      return "Please fill all required hospital fields.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }

    if (!generatePassword && !password) {
      return "Please enter a password or enable auto-generation.";
    }

    if (phone.length < 7) {
      return "Please enter a valid phone number.";
    }

    return "";
  };

  const handleCreateHospital = async (e) => {
    e.preventDefault();
    const validationError = validateHospitalForm();

    if (validationError) {
      setHospitalFormError(validationError);
      return;
    }

    setIsSubmittingHospital(true);
    setHospitalFormError("");

    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: hospitalForm.name.trim(),
        email: hospitalForm.email.trim(),
        phone: hospitalForm.phone.trim(),
        address: hospitalForm.address.trim(),
        emergencyTypes: hospitalForm.emergencyTypes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        ...(generatePassword ? {} : { password: hospitalForm.password.trim() }),
      };

      let response;
      if (isEditingHospital && editingHospitalId) {
        response = await axios.put(`${API_BASE_URL}/api/admin/hospital/${editingHospitalId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await axios.post(`${API_BASE_URL}/api/admin/create-hospital`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setHospitalForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        emergencyTypes: "",
      });
      setGeneratePassword(true);
      setShowHospitalModal(false);
      setIsEditingHospital(false);
      setEditingHospitalId(null);
      await fetchDashboardData();
      if (response.data.generatedPassword) {
        setPasswordToShow(response.data.generatedPassword);
        setShowPasswordModal(true);
      } else {
        showSuccessToast("Hospital created successfully.");
      }
    } catch (error) {
      setHospitalFormError(error.response?.data?.message || "Failed to create hospital");
      console.error(error);
    } finally {
      setIsSubmittingHospital(false);
    }
  };

  const handleHospitalAction = (action, hospital) => {
    if (!hospital) return showSuccessToast('Hospital not found');
    const token = localStorage.getItem('token');

    if (action === 'View') {
      setSelectedHospital(hospital);
      setShowViewModal(true);
      return;
    }

    if (action === 'Edit') {
      setIsEditingHospital(true);
      setEditingHospitalId(hospital._id);
      setHospitalForm({
        name: hospital.name || '',
        email: hospital.email || '',
        password: '',
        phone: hospital.phone || '',
        address: hospital.address || '',
        emergencyTypes: (hospital.emergencyTypes || []).join(', '),
      });
      setShowHospitalModal(true);
      return;
    }

    if (action === 'Delete') {
      if (!window.confirm(`Are you sure you want to delete ${hospital.name}? This cannot be undone.`)) return;
      axios.delete(`${API_BASE_URL}/api/admin/hospital/${hospital._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => {
        showSuccessToast('Hospital deleted');
        fetchDashboardData();
      }).catch((err) => {
        alert(err.response?.data?.message || 'Failed to delete hospital');
      });
      return;
    }

    if (action === 'Reset Password') {
      if (!window.confirm(`Reset password for ${hospital.name}?`)) return;
      axios.post(`${API_BASE_URL}/api/admin/hospital/${hospital._id}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (res.data.generatedPassword) {
          setPasswordToShow(res.data.generatedPassword);
          setShowPasswordModal(true);
        } else {
          showSuccessToast('Password reset successfully');
        }
      }).catch((err) => {
        alert(err.response?.data?.message || 'Failed to reset password');
      });
      return;
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {showToast && (
        <div className="fixed top-5 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 rounded-3xl border border-emerald-500 bg-emerald-500/10 px-5 py-4 text-emerald-200 shadow-2xl backdrop-blur-xl">
          {toastMessage}
        </div>
      )}

      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-red-500">🚑 SURAKSHA</h1>
            <div className="rounded-full bg-slate-900 px-4 py-1 text-sm font-medium text-slate-300">ADMIN PANEL</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
                <Shield size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-emerald-400">System Online</p>
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 transition-colors hover:bg-slate-800"
            >
              <LogOut size={18} />
              Logout
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-bold">System Overview</h2>
            <p className="mt-1 text-slate-400">Real-time Emergency Response Monitoring</p>
          </div>
          <div className="text-sm text-slate-400">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400">Total Users</p>
                <p className="mt-4 text-4xl font-bold">{dashboardData.stats.totalUsers.toLocaleString()}</p>
              </div>
              <Users size={40} className="text-blue-500" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400">Total Hospitals</p>
                <p className="mt-4 text-4xl font-bold">{dashboardData.stats.totalHospitals}</p>
              </div>
              <Hospital size={40} className="text-emerald-500" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400">Hospitals Online</p>
                <p className="mt-4 text-4xl font-bold text-emerald-400">{dashboardData.stats.hospitalsOnline}</p>
              </div>
              <AlertTriangle size={40} className="text-emerald-400" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400">Hospitals Offline</p>
                <p className="mt-4 text-4xl font-bold text-amber-400">{dashboardData.stats.hospitalsOffline}</p>
              </div>
              <Hospital size={40} className="text-amber-400" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400">Active SOS Requests</p>
                <p className="mt-4 text-4xl font-bold text-red-500">{dashboardData.stats.activeSosRequests}</p>
              </div>
              <Ambulance size={40} className="text-red-500" />
            </div>
          </div>
        </div>

        <div className="mb-10 rounded-3xl border border-slate-700 bg-slate-900 p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Hospital Management</h3>
              <p className="text-sm text-slate-400">Manage hospital accounts directly from the dashboard.</p>
            </div>
            <button
              onClick={() => setShowHospitalModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              <Plus size={16} />
              Add Hospital
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="px-3 py-4">Hospital Name</th>
                  <th className="px-3 py-4">Email</th>
                  <th className="px-3 py-4">Address</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="px-3 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Loading hospitals...
                    </td>
                  </tr>
                ) : dashboardData.hospitals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No hospitals found.
                    </td>
                  </tr>
                ) : (
                  dashboardData.hospitals.map((hospital) => (
                    <tr key={hospital._id} className="hover:bg-slate-800/50">
                      <td className="px-3 py-4 font-medium">{hospital.name}</td>
                      <td className="px-3 py-4 text-slate-400">{hospital.email}</td>
                      <td className="px-3 py-4 text-slate-400">{hospital.address}</td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${hospital.isOnline ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                          {hospital.isOnline ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleHospitalAction("View", hospital)} className="rounded-xl border border-slate-700 px-3 py-2 text-slate-300 transition-colors hover:bg-slate-800">
                            <Eye size={14} />
                          </button>
                          <button type="button" onClick={() => handleHospitalAction("Edit", hospital)} className="rounded-xl border border-slate-700 px-3 py-2 text-slate-300 transition-colors hover:bg-slate-800">
                            <Pencil size={14} />
                          </button>
                          <button type="button" onClick={() => handleHospitalAction("Delete", hospital)} className="rounded-xl border border-slate-700 px-3 py-2 text-slate-300 transition-colors hover:bg-slate-800">
                            <Trash2 size={14} />
                          </button>
                          <button type="button" onClick={() => handleHospitalAction("Reset Password", hospital)} className="rounded-xl border border-slate-700 px-3 py-2 text-slate-300 transition-colors hover:bg-slate-800">
                            <KeyRound size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hospital Map + Recent Requests (simplified) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
          <div className="xl:col-span-5">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 h-full">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <Hospital size={22} className="text-emerald-500" />
                Hospital Locations
              </h3>
              <HospitalMap hospitals={dashboardData.hospitals} height={420} />
            </div>
          </div>

          <div className="xl:col-span-7">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 h-full">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <Clock className="text-red-500" /> Recent Emergency Requests
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-sm">
                      <th className="text-left py-4">PATIENT</th>
                      <th className="text-left py-4">HOSPITAL</th>
                      <th className="text-left py-4">TYPE</th>
                      <th className="text-left py-4">TIME</th>
                      <th className="text-left py-4">SEVERITY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(dashboardData.recentRequests || []).map((req) => (
                      <tr key={req.id} className="hover:bg-slate-800/50">
                        <td className="py-5 font-medium">{req.patient}</td>
                        <td className="py-5 text-slate-400">{req.hospital}</td>
                        <td className="py-5">{req.type}</td>
                        <td className="py-5 text-sm text-slate-400">{req.time}</td>
                        <td className="py-5">
                          <span className={`px-4 py-1 text-xs font-medium rounded-full ${req.status === "Critical" ? "bg-red-500/20 text-red-400" : req.status === "High" ? "bg-orange-500/20 text-orange-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">Live SOS Monitor</h3>
                <p className="text-sm text-slate-400">Current active requests from the emergency feed.</p>
              </div>
            </div>

            {dashboardData.activeEmergencies.length === 0 ? (
              <div className="flex h-60 items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 text-center">
                <div>
                  <AlertTriangle size={40} className="mx-auto mb-3 text-slate-500" />
                  <p className="text-slate-400">No active SOS requests at the moment.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.activeEmergencies.map((emergency) => (
                  <div key={emergency._id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-100">{emergency.user?.name || "Unknown User"}</p>
                        <p className="text-sm text-slate-400">{emergency.assignedHospital?.name || "Awaiting assignment"}</p>
                      </div>
                      <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400">
                        {emergency.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showHospitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-950 p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">{isEditingHospital ? 'Edit Hospital' : 'Add Hospital'}</h3>
                <p className="text-sm text-slate-400">{isEditingHospital ? 'Update hospital account details.' : 'Create a new hospital account for the system.'}</p>
              </div>
              <button onClick={() => { setShowHospitalModal(false); setIsEditingHospital(false); setEditingHospitalId(null); }} className="text-slate-400 hover:text-white">
                Close
              </button>
            </div>

            <form onSubmit={handleCreateHospital} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Hospital Name</label>
                  <input
                    name="name"
                    value={hospitalForm.name}
                    onChange={handleHospitalChange}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Hospital Email</label>
                  <input
                    type="email"
                    name="email"
                    value={hospitalForm.email}
                    onChange={handleHospitalChange}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Hospital Password</label>
                  <label className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={generatePassword}
                      onChange={(e) => setGeneratePassword(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900"
                    />
                    Auto-generate password
                  </label>
                  {!generatePassword && (
                    <input
                      type="password"
                      name="password"
                      value={hospitalForm.password}
                      onChange={handleHospitalChange}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                      required
                    />
                  )}
                  {generatePassword && (
                    <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                      A secure password will be generated automatically.
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Phone Number</label>
                  <input
                    name="phone"
                    value={hospitalForm.phone}
                    onChange={handleHospitalChange}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-400">Address</label>
                  <input
                    name="address"
                    value={hospitalForm.address}
                    onChange={handleHospitalChange}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-400">Emergency Types</label>
                  <input
                    name="emergencyTypes"
                    value={hospitalForm.emergencyTypes}
                    onChange={handleHospitalChange}
                    placeholder="Trauma, Cardiac, ICU"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                    required
                  />
                </div>
              </div>

              {hospitalFormError && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {hospitalFormError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowHospitalModal(false); setIsEditingHospital(false); setEditingHospitalId(null); }}
                  className="rounded-2xl border border-slate-700 px-6 py-3 text-slate-300 transition-colors hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingHospital}
                  className="rounded-2xl bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                  {isSubmittingHospital ? (isEditingHospital ? 'Saving...' : 'Creating...') : (isEditingHospital ? 'Save Changes' : 'Create Hospital')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-w-2xl w-full rounded-3xl border border-slate-700 bg-slate-950 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-semibold">{selectedHospital.name}</h3>
                <p className="text-sm text-slate-400">Hospital details</p>
              </div>
              <button onClick={() => { setShowViewModal(false); setSelectedHospital(null); }} className="text-slate-400 hover:text-white">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div><strong>Email:</strong> <span className="text-slate-300">{selectedHospital.email}</span></div>
              <div><strong>Phone:</strong> <span className="text-slate-300">{selectedHospital.phone}</span></div>
              <div><strong>Address:</strong> <span className="text-slate-300">{selectedHospital.address}</span></div>
              <div><strong>Emergency Types:</strong> <span className="text-slate-300">{(selectedHospital.emergencyTypes||[]).join(', ')}</span></div>
              <div><strong>Status:</strong> <span className="text-slate-300">{selectedHospital.isOnline ? 'Online' : 'Offline'}</span></div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => { setShowViewModal(false); setSelectedHospital(null); }} className="rounded-2xl border border-slate-700 px-4 py-2 text-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-w-sm w-full rounded-3xl border border-slate-700 bg-slate-950 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">Generated Password</h3>
                <p className="text-sm text-slate-400">Share this password with the hospital for first login.</p>
              </div>
              <button onClick={() => { setShowPasswordModal(false); setPasswordToShow(""); }} className="text-slate-400 hover:text-white">Close</button>
            </div>

            <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
              <div className="text-2xl font-mono text-emerald-200 break-all">{passwordToShow}</div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { navigator.clipboard?.writeText(passwordToShow); showSuccessToast('Password copied to clipboard'); }}
                className="rounded-2xl border border-slate-700 px-4 py-2 text-slate-300"
              >
                Copy
              </button>
              <button onClick={() => { setShowPasswordModal(false); setPasswordToShow(""); }} className="rounded-2xl bg-blue-600 px-4 py-2 text-white">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}