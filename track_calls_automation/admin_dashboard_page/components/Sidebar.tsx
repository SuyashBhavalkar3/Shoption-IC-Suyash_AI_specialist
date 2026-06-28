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
    {
      id: "dashboard",
      label: "Overview",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      id: "users",
      label: "Employees",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 20c-2.034 0-3.929-.53-5.589-1.458l-.011-.006a1.105 1.105 0 0 1-.54-.957V16.5a4.125 4.125 0 0 1 7.533-2.493M12 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6.3 2.906a3 3 0 1 0 0-4.121 3 3 0 0 0 0 4.121Z" />
        </svg>
      ),
    },
  ];

  if (meRole === "super_admin" || meRole === "admin") {
    menuItems.push({
      id: "user-management",
      label: "Manage Access",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a6.723 6.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
    });
    menuItems.push({
      id: "workforce",
      label: "Workforce Tree",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
    });
  }

  return (
    <aside className="w-72 bg-[#0E1528] border-r border-slate-800/80 flex flex-col h-full relative z-10 shadow-2xl">
      {/* Sidebar Top / Brand Logo */}
      <div className="h-20 px-6 border-b border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => {
            setSelectedView("dashboard");
            onClose?.();
          }}
          className="flex items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer text-left border-0 bg-transparent p-0"
          title="Go to Home Dashboard"
        >
          <img
            src="/logo_product_page.png"
            alt="LeadLens Logo"
            width={105}
            height={24}
            className="object-contain brightness-110"
          />
          <span className="text-[8px] uppercase font-black tracking-widest text-[#00E6B8] border-l border-slate-800 pl-2.5">
            ERP
          </span>
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            aria-label="Close Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-4 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = selectedView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedView(item.id);
                onClose?.();
              }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-[#1F8FFF]/15 to-[#8B5CF6]/10 text-white border border-[#1F8FFF]/25 shadow-lg shadow-[#1F8FFF]/5"
                  : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800/30"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer / User Info & Logout */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between gap-3 bg-[#090D1A]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#1F8FFF]/10 to-[#8B5CF6]/10 border border-[#1F8FFF]/25 flex items-center justify-center text-[#1F8FFF] font-bold text-xs shadow-sm shrink-0">
            {meName[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-[#F8FAFC] text-xs truncate" title={meName}>{meName}</span>
            <span className="text-[10px] text-[#94A3B8] font-semibold capitalize truncate">{meRole?.replace("_", " ") || "Operator"}</span>
          </div>
        </div>

        <button
          onClick={() => {
            onLogout();
            onClose?.();
          }}
          className="p-2 rounded-xl text-rose-400 border border-rose-950/50 hover:border-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center cursor-pointer shrink-0"
          title="Logout Session"
          aria-label="Logout Session"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
