import type { ReactNode } from "react";

type SidebarProps = {
  meName: string;
  meRole?: string;
  onLogout: () => void;
  selectedView: string;
  setSelectedView: (view: string) => void;
  onClose?: () => void;
};

export default function Sidebar({ meName, meRole, onLogout, selectedView, setSelectedView, onClose }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Analytics Dashboard", icon: "" },
    { id: "users", label: "Users & Registry", icon: "" },
  ];

  if (meRole === "super_admin" || meRole === "admin") {
    menuItems.push({ id: "user-management", label: "User Management", icon: "" });
  }

  return (
    <aside className="w-80 bg-white border-r border-slate-100 flex flex-col h-full relative z-10 shadow-xl">
      {/* Sidebar Top / Brand Logo */}
      <div className="h-24 px-8 border-b border-slate-50 flex items-center justify-between">
        <span className="text-xs uppercase font-black tracking-widest text-[#04693F]">
          Console Menu
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all"
            aria-label="Close Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* User Info Card */}
      <div className="p-6 border-b border-slate-50">
        <div className="bg-slate-50/50 rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#e6f7ee] to-[#e8f4fc] border border-[#04693F]/10 flex items-center justify-center text-[#04693F] font-bold text-sm shadow-sm">
            {meName[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-slate-800 text-sm truncate">{meName}</span>
            <span className="text-xs text-slate-400 font-medium capitalize">Console Operator</span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = selectedView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedView(item.id);
                onClose?.();
              }}
              className={`w-full flex items-center gap-4 py-3.5 px-5 rounded-2xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] text-[#04693F] border border-[#04693F]/10 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer / Logout */}
      <div className="p-6 border-t border-slate-50">
        <button
          onClick={() => {
            onLogout();
            onClose?.();
          }}
          className="w-full py-3.5 px-5 rounded-2xl text-sm font-bold text-rose-600 border border-rose-100 hover:bg-rose-50/50 transition-colors flex items-center justify-center gap-3"
        >
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
}
