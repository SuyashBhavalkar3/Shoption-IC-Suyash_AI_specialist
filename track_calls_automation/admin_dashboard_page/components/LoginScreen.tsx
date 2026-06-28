import type { FormEvent } from "react";

type LoginScreenProps = {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  error: string;
  loading: boolean;
};

export default function LoginScreen({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  error,
  loading,
}: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] flex flex-col">
      {/* Navbar Header */}
      <header className="bg-[#0E1528] border-b border-slate-800/80 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo_product_page.png"
              alt="LeadLens Logo"
              width={130}
              height={32}
              className="object-contain brightness-110"
            />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#00E6B8] border-l border-slate-800 pl-3">
              Console login
            </span>
          </div>
          <div className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
            Super Admin View
          </div>
        </div>
      </header>

      {/* Main Form Center Area */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-[#0E1528] border border-slate-800/80 rounded-[2.5rem] shadow-2xl overflow-hidden grid md:grid-cols-[1.1fr_0.9fr] min-h-[600px]">
          {/* Left Side Info Panel */}
          <div className="bg-gradient-to-br from-[#0E1528] to-[#050816] p-10 md:p-12 text-[#F8FAFC] flex flex-col justify-between relative overflow-hidden">
            {/* Subtle background circles */}
            <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-[#1F8FFF]/5 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-[#00E6B8]/5 blur-3xl" />

            <div className="relative z-10">
              <span className="inline-flex rounded-full bg-[#1F8FFF]/10 border border-[#1F8FFF]/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1F8FFF]">
                Super Admin Console
              </span>
              <h1 className="mt-8 text-4xl md:text-5xl font-black leading-tight tracking-tight text-white">
                Real-Time Call Analytics
              </h1>
              <p className="mt-4 text-sm md:text-base text-[#94A3B8] font-medium leading-relaxed max-w-md">
                Securely access organisation levels, manage employee registries, and review calls synced in real time across the console.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
              <div className="bg-[#0E1528]/50 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                <div className="text-[10px] uppercase font-bold tracking-widest text-[#94A3B8]">Source</div>
                <div className="mt-1 text-base font-bold text-white">FastAPI Server</div>
              </div>
              <div className="bg-[#0E1528]/50 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                <div className="text-[10px] uppercase font-bold tracking-widest text-[#94A3B8]">Registry</div>
                <div className="mt-1 text-base font-bold text-white">Live Status Sync</div>
              </div>
            </div>
          </div>

          {/* Right Side Form Panel */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-[#0E1528]">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-white tracking-tight">Sign In</h2>
              <p className="mt-2 text-sm text-[#94A3B8] font-medium">
                Enter your admin credentials to load the database control panel.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#94A3B8] mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-[#050816] px-5 py-4 text-sm font-semibold outline-none transition focus:border-[#1F8FFF] focus:ring-4 focus:ring-[#1F8FFF]/10 text-white placeholder-slate-600"
                  placeholder="name@shoption.in"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#94A3B8] mb-2 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-[#050816] px-5 py-4 text-sm font-semibold outline-none transition focus:border-[#1F8FFF] focus:ring-4 focus:ring-[#1F8FFF]/10 text-white placeholder-slate-600"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-900/50 bg-rose-950/20 px-5 py-4 text-sm font-bold text-rose-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#1F8FFF] to-[#8B5CF6] text-white py-4 text-sm font-bold shadow-lg shadow-[#1F8FFF]/15 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Authenticating Session..." : "Open Control Panel"}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0E1528] border-t border-slate-800/80 py-6 text-center text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
        © {new Date().getFullYear()} LeadLens Console. All rights reserved.
      </footer>
    </div>
  );
}
