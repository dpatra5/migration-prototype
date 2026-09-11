import { useEffect, useRef, useState } from "react";

type ProfileMenuProps = {
  name: string;
  role: string;
  onSignOut: () => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}

const menuItems = [
  { label: "Basic details", icon: "👤", iconBg: "bg-blue-50 text-blue-600" },
  { label: "Change language", icon: "🌐", iconBg: "bg-indigo-50 text-indigo-600" },
  { label: "Change password", icon: "🔒", iconBg: "bg-amber-50 text-amber-600" },
];

export function ProfileMenu({ name, role, onSignOut }: Readonly<ProfileMenuProps>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(name);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-md ring-2 ring-gray-700 transition-transform duration-200 hover:scale-105 hover:ring-blue-400"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 pt-3">
          <div
            role="menu"
            className="animate-fade-in-up w-52 overflow-hidden rounded-xl border border-slate-200/70 bg-white/85 shadow-xl ring-1 ring-slate-900/5 backdrop-blur-xl"
          >
          <div className="flex items-center gap-2.5 border-b border-slate-200/70 bg-slate-800/90 px-3 py-3 backdrop-blur">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{name}</p>
              <p className="truncate text-xs text-slate-300">{role}</p>
            </div>
          </div>

          <div className="p-1.5">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100/80"
              >
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs ${item.iconBg}`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-200/70 p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs">
                🚪
              </span>
              <span className="flex-1 truncate">Sign out</span>
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
