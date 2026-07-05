import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  Truck,
  MapPin,
  Clock,
  Activity,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  LogOut,
} from "lucide-react";

const DriverDashboard = () => {
  const navigate = useNavigate();
const [driver, setDriver] = useState(() => {
  try {
    const storedDriver = localStorage.getItem("driver");
    return storedDriver ? JSON.parse(storedDriver) : null;
  } catch {
    return null;
  }
});
const [emergency, setEmergency] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [status, setStatus] = useState(() => {
  try {
    const storedDriver = localStorage.getItem("driver");
    const parsed = storedDriver ? JSON.parse(storedDriver) : null;
    return parsed?.status || "Offline";
  } catch {
    return "Offline";
  }
});
const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const storedDriver = localStorage.getItem("driver");

    if (!token || role !== "ambulance" || !storedDriver) {
      navigate("/driver-login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/ambulance/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setDriver(response.data.ambulance);
          setEmergency(response.data.emergency);
          setStatus(response.data.ambulance.status || "Offline");
          localStorage.setItem("driver", JSON.stringify(response.data.ambulance));
        }
      } catch (error) {
        console.error("Driver profile fetch failed", error);
        localStorage.removeItem("token");
        localStorage.removeItem("driver");
        localStorage.removeItem("role");
        navigate("/driver-login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("driver");
    localStorage.removeItem("role");
    navigate("/driver-login");
  };

  const fetchCurrentEmergency = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/ambulance/auth/current-emergency", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setEmergency(response.data.emergency);
      }
    } catch (error) {
      console.error("Failed to fetch current emergency", error);
    }
  };

  const refreshEmergency = async () => {
    await fetchCurrentEmergency();
  };

  const handleTripAction = async (action) => {
    if (!emergency?._id) {
      setActionMessage("No active emergency to update.");
      return;
    }

    const token = localStorage.getItem("token");
    let url = "";
    let successMessage = "";

    if (action === "accept") {
      url = `http://localhost:5000/api/ambulance/auth/accept-trip/${emergency._id}`;
      successMessage = "Trip accepted. Proceed to the patient.";
    } else if (action === "start") {
      url = `http://localhost:5000/api/ambulance/auth/start-trip/${emergency._id}`;
      successMessage = "Trip started. Drive safely to the patient.";
    } else if (action === "complete") {
      url = `http://localhost:5000/api/ambulance/auth/complete-trip/${emergency._id}`;
      successMessage = "Trip completed. Emergency marked finished.";
    }

    try {
      const response = await axios.put(url, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setActionMessage(successMessage);
        setEmergency(response.data.emergency);
      } else {
        setActionMessage(response.data.message || "Unable to update trip status.");
      }
    } catch (error) {
      console.error("Trip action failed", error);
      setActionMessage(error.response?.data?.message || "Trip action failed.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto mb-4 h-12 w-12 text-red-500 animate-spin" />
          <p className="text-lg text-slate-300">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#060708] text-white">
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-3xl bg-red-500/10 p-3 text-red-400">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ambulance Driver</p>
              <h1 className="text-2xl font-semibold">SURAKSHA Driver Dashboard</h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-3xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium transition hover:border-red-500/40"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-900/40">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Current Assignment</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">{driver.driverName}</h2>
                <p className="text-slate-400">Vehicle: {driver.vehicleNumber}</p>
              </div>
              <div className="rounded-3xl bg-slate-900 px-5 py-4 text-slate-200">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</p>
                <p className="mt-2 text-2xl font-semibold text-white">{status}</p>
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center gap-3 text-slate-300">
                  <User className="h-5 w-5 text-red-400" />
                  <p className="text-sm font-medium">Driver Information</p>
                </div>
                <div className="mt-5 space-y-4 text-sm text-slate-300">
                  <div>
                    <p className="text-slate-500">Name</p>
                    <p>{driver.driverName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Phone</p>
                    <p>{driver.driverPhone}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Vehicle Type</p>
                    <p>{driver.vehicleType}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center gap-3 text-slate-300">
                  <MapPin className="h-5 w-5 text-emerald-400" />
                  <p className="text-sm font-medium">Assignment Details</p>
                </div>
                <div className="mt-5 space-y-4 text-sm text-slate-300">
                  <div>
                    <p className="text-slate-500">Assigned Patient</p>
                    <p>{emergency?.user?.name || "No patient assigned"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Hospital</p>
                    <p>{emergency?.assignedHospital?.name || "No hospital assigned"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Patient Contact</p>
                    <p>{emergency?.user?.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Emergency Status</p>
                    <p>{emergency?.status || "No active assignment"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Notes</p>
              <div className="mt-4 flex flex-col gap-4 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Share real-time updates with your hospital dispatch if the route changes.
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Use the complete button once the patient has been safely delivered.
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-900/40">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Trip Controls</p>
              <h3 className="mt-3 text-2xl font-semibold">Action Center</h3>
              <div className="mt-8 space-y-4">
                {emergency?.status === "ambulance_assigned" && (
                  <button
                    onClick={() => handleTripAction("accept")}
                    className="flex w-full items-center justify-between rounded-3xl bg-blue-600 px-5 py-4 text-white transition hover:bg-blue-500"
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <ArrowRight className="h-5 w-5" />
                      Accept Trip
                    </span>
                    <Activity className="h-5 w-5" />
                  </button>
                )}
                {emergency?.status === "driver_accepted" && (
                  <button
                    onClick={() => handleTripAction("start")}
                    className="flex w-full items-center justify-between rounded-3xl bg-emerald-500 px-5 py-4 text-white transition hover:bg-emerald-400"
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <ArrowRight className="h-5 w-5" />
                      Start Trip
                    </span>
                    <Activity className="h-5 w-5" />
                  </button>
                )}
                {emergency?.status === "driver_on_the_way" && (
                  <button
                    onClick={() => handleTripAction("complete")}
                    className="flex w-full items-center justify-between rounded-3xl bg-slate-800 px-5 py-4 text-slate-200 transition hover:bg-slate-700"
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <ArrowLeft className="h-5 w-5" />
                      Complete Trip
                    </span>
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </button>
                )}
                {!emergency && (
                  <p className="text-sm text-slate-400">No active trip assigned yet.</p>
                )}
              </div>
              {actionMessage && (
                <p className="mt-6 rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                  {actionMessage}
                </p>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-900/40">
              <div className="flex items-center gap-3 text-slate-300">
                <Truck className="h-5 w-5 text-sky-400" />
                <p className="text-sm font-medium">Vehicle Overview</p>
              </div>
              <div className="mt-6 space-y-4 text-sm text-slate-300">
                <div className="flex items-center justify-between rounded-3xl bg-slate-900/80 px-4 py-4">
                  <p>Vehicle Number</p>
                  <span>{driver.vehicleNumber}</span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-slate-900/80 px-4 py-4">
                  <p>Status</p>
                  <span>{status}</span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-slate-900/80 px-4 py-4">
                  <p>Driver Email</p>
                  <span>{driver.email}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
