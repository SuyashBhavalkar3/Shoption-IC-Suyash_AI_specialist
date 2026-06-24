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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Navbar Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo_product_page.png"
              alt="LeadLens Logo"
              width={130}
              height={32}
              className="object-contain"
            />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#04693F] border-l border-slate-200 pl-3">
              Console login
            </span>
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Super Admin View
          </div>
        </div>
      </header>

      {/* Main Form Center Area */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white border border-slate-100 rounded-[2.5rem] shadow-xl overflow-hidden grid md:grid-cols-[1.1fr_0.9fr] min-h-[600px]">
          {/* Left Side Info Panel - Styled with Light Mint to Light Blue Gradient */}
          <div className="bg-gradient-to-br from-[#e6f7ee] to-[#e8f4fc] p-10 md:p-12 text-slate-800 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle background circles */}
            <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-[#04693F]/5 blur-2xl" />
            <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-[#015C96]/5 blur-3xl" />

            <div className="relative z-10">
              <span className="inline-flex rounded-full bg-white/60 border border-[#04693F]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#04693F]">
                Super Admin Console
              </span>
              <h1 className="mt-8 text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-800">
                Real-Time Call Analytics
              </h1>
              <p className="mt-4 text-sm md:text-base text-slate-500 font-medium leading-relaxed max-w-md">
                Securely access organisation levels, manage employee registries, and review calls synced in real time across the console.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Source</div>
                <div className="mt-1 text-base font-bold text-slate-700">FastAPI Server</div>
              </div>
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Registry</div>
                <div className="mt-1 text-base font-bold text-slate-700">Live Status Sync</div>
              </div>
            </div>
          </div>

          {/* Right Side Form Panel */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Sign In</h2>
              <p className="mt-2 text-sm text-slate-400 font-medium">
                Enter your admin credentials to load the database control panel.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold outline-none transition focus:border-[#04693F] focus:ring-4 focus:ring-[#04693F]/5 text-slate-700"
                  placeholder="name@shoption.in"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold outline-none transition focus:border-[#04693F] focus:ring-4 focus:ring-[#04693F]/5 text-slate-700"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 px-5 py-4 text-sm font-bold text-rose-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] text-[#04693F] border border-[#04693F]/20 py-4 text-sm font-bold shadow-sm hover:from-[#d0f0dd] hover:to-[#dceefc] transition-all disabled:opacity-50"
              >
                {loading ? "Authenticating Session..." : "Open Control Panel"}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
        © {new Date().getFullYear()} LeadLens Console. All rights reserved.
      </footer>
    </div>
  );
}
