interface SidebarItem {
  label: string;
  icon: string;
  modal?: string;
  color: string;
}

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string, modal?: string | null) => void;
}

const items: SidebarItem[] = [
  { label: "Dashboard",         icon: "📊", color: "blue" },
  { label: "Upload",            icon: "⬆️",  modal: "upload",       color: "emerald" },
  { label: "Mapping",           icon: "🗺️", modal: "mapping",      color: "purple" },
  { label: "Review",            icon: "👁️",  modal: "review",       color: "amber" },
  { label: "Unclassified Docs", icon: "📄", modal: "unclassified", color: "orange" },
  { label: "Audit Trail",       icon: "🔍", modal: "audit",        color: "indigo" },
  { label: "Notifications",     icon: "🔔", color: "pink" },
  { label: "Settings",          icon: "⚙️",  color: "slate" },
];

const colorMap: Record<string, { active: string; hover: string }> = {
  blue:    { active: "bg-blue-600 text-white shadow-blue-600/30",       hover: "hover:bg-white/10" },
  emerald: { active: "bg-emerald-600 text-white shadow-emerald-600/30", hover: "hover:bg-white/10" },
  purple:  { active: "bg-purple-600 text-white shadow-purple-600/30",   hover: "hover:bg-white/10" },
  amber:   { active: "bg-amber-500 text-white shadow-amber-500/30",     hover: "hover:bg-white/10" },
  orange:  { active: "bg-orange-500 text-white shadow-orange-500/30",   hover: "hover:bg-white/10" },
  indigo:  { active: "bg-indigo-600 text-white shadow-indigo-600/30",   hover: "hover:bg-white/10" },
  pink:    { active: "bg-pink-600 text-white shadow-pink-600/30",       hover: "hover:bg-white/10" },
  slate:   { active: "bg-slate-600 text-white shadow-slate-600/30",     hover: "hover:bg-white/10" },
};

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  return (
    <aside className="w-60 bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col flex-shrink-0">
      <div className="px-6 py-6 border-b border-white/10">
        <h2 className="text-white font-bold text-base tracking-wide">
          Migration Utility
        </h2>
        <p className="text-gray-500 text-xs mt-0.5">Document Migration Tool</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
        {items.map((item) => {
          const isActive = activeItem === item.label;
          const c = colorMap[item.color];
          return (
            <button
              key={item.label}
              onClick={() => onItemClick(item.label, item.modal ?? null)}
              className={`
                w-full text-left px-3.5 py-2.5 rounded-xl transition-all duration-150
                flex items-center gap-3 text-sm font-medium
                ${isActive ? `${c.active} shadow-lg` : `text-gray-400 ${c.hover}`}
              `}
            >
              <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            D
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">Debabrata</p>
            <p className="text-gray-500 text-xs truncate">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
