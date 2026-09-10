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
        <div
          role="menu"
          className="animate-fade-in absolute right-0 top-12 z-30 w-56 overflow-hidden rounded-2xl border border-gray-200/70 bg-gray-50 shadow-2xl ring-1 ring-black/5"
        >
          <div className="flex items-center gap-3 bg-black px-4 py-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white ring-2 ring-white/30 backdrop-blur">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{name}</p>
              <p className="truncate text-xs text-blue-100">{role}</p>
            </div>
          </div>

          <div className="space-y-0 p-1.5">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-3 rounded-xl px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-white hover:shadow-sm"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${item.iconBg}`}
                >
                  {item.icon}
                </span>
                <span className="min-w-[130px] text-center">
                    {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200/70 p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="flex w-full items-center justify-center gap-3 rounded-xl px-2 py-1.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-sm">
                🚪
              </span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
