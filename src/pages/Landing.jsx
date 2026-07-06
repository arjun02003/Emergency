import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-red-500/50">
              🚑
            </div>
            <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              SURAKSHA
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <button className="px-6 py-2.5 text-sm font-medium rounded-2xl border border-slate-700 hover:bg-slate-900 hover:border-slate-600 transition-all duration-200">
                Login
              </button>
            </Link>
            <Link to="/register">
              <button className="px-7 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-2xl transition-all duration-200">
                Sign Up Free
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-6 text-center max-w-4xl mx-auto relative">
        <div className="absolute inset-0 bg-[radial-gradient(at_center,#7f1d1d_0%,transparent_70%)] opacity-40 pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-2 bg-red-900/30 text-red-400 text-sm font-medium px-6 py-3 rounded-3xl border border-red-500/30 mb-8">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          INDIA'S MOST TRUSTED EMERGENCY NETWORK
        </div>

        <h1 className="text-6xl md:text-7xl font-bold leading-none tracking-tighter mb-8">
          Ek Tap Mein<br />
          <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
            Madad Mil Jayegi
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-300 max-w-xl mx-auto mb-12">
          Ambulance • Smart Hospital • Live Tracking • Family Safety
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-12">
          <Link to="/sos">
            <button className="group px-12 py-6 bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:via-red-400 hover:to-red-500 active:scale-95 text-2xl font-bold rounded-3xl shadow-2xl shadow-red-600/60 transition-all duration-300 flex items-center gap-4 mx-auto">
              <span className="text-3xl group-active:rotate-12 transition-transform">🚨</span>
              SOS Emergency
              <span className="text-xl opacity-75 group-hover:translate-x-2 transition-transform">→</span>
            </button>
          </Link>
          <Link to="/driver-login">
            <button className="px-8 py-6 text-xl font-semibold rounded-3xl border border-slate-700 hover:bg-slate-900 hover:border-slate-600 transition-all duration-200 flex items-center gap-3">
              🚑 Driver Login
            </button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-green-500">●</span> Average 7 min response
          </div>
          <div>50,000+ Lives Saved</div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Designed for Real Emergencies
          </h2>
          <p className="text-slate-400 text-lg">Fast. Reliable. Life-saving.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "🚨", title: "One-Tap SOS", desc: "Live location, photo & voice note instantly shared with emergency services" },
            { icon: "🏥", title: "Smart Hospital Finder", desc: "Best hospital suggestion using Haversine distance with real-time bed availability" },
            { icon: "🚑", title: "Live Ambulance Tracking", desc: "Real-time GPS tracking with accurate ETA and driver workflow" },
            { icon: "📍", title: "Works Offline", desc: "Automatically shares precise location even with weak network" },
            { icon: "👨‍👩‍👧", title: "Family Alert", desc: "Instant SMS + Call to your emergency contacts" },
            { icon: "🛡️", title: "Medical Profile", desc: "Blood group, allergies & medical history shared instantly" }
          ].map((f, i) => (
            <div 
              key={i} 
              className="group bg-slate-900 border border-slate-800 hover:border-red-500/40 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/10"
            >
              <div className="text-5xl mb-6 transition-transform group-hover:scale-110 duration-300">
                {f.icon}
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-white">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Bar */}
      <div className="bg-slate-900 py-8 border-t border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 text-center text-slate-400 text-sm">
          Trusted by people across Delhi • Mumbai • Bangalore • Hyderabad • Lucknow &amp; more
        </div>
      </div>
    </div>
  );
}