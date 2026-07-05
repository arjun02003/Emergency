import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield, Truck } from "lucide-react";

const DriverLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await axios.post("http://localhost:5000/api/ambulance/login", {
        email,
        password,
      });

      const { token, ambulance } = response.data;
      if (!token || !ambulance) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("driver", JSON.stringify(ambulance));
      localStorage.setItem("role", "ambulance");

      navigate("/driver-dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Driver login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.2),_transparent_30%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.15),_transparent_30%)]" />
      <div className="relative w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-950/95 shadow-2xl shadow-slate-900/30 backdrop-blur-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 px-8 py-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="rounded-3xl bg-white/10 p-3">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">SURAKSHA</h1>
              <p className="text-sm text-slate-200">Ambulance Driver Login</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-10">
          <div className="mb-8 text-center">
            <Truck className="mx-auto mb-4 h-11 w-11 text-red-500" />
            <h2 className="text-2xl font-semibold">Driver Sign In</h2>
            <p className="text-sm text-slate-400 mt-2">Access your assigned emergency and start trips safely.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
                placeholder="driver@hospital.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 pr-12 text-white outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-3xl bg-red-500 px-5 py-3 text-base font-semibold text-white transition hover:bg-red-400 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>

            <p className="text-center text-sm text-slate-500">
              New driver? Contact your hospital administrator to create your account.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DriverLogin;
