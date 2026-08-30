"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  href: string;
  icon: string;
  label: string;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/",
    icon: "🏠",
    label: "Accueil",
  },
  {
    href: "/calendar",
    icon: "📅",
    label: "Calendrier",
  },
  // {
  //   href: "/communities",
  //   icon: "👥",
  //   label: "Communautés",
  // },
  {
    href: "/notifications",
    icon: "🔔",
    label: "Notifications",
  },
  {
    href: "/profile",
    icon: "👤",
    label: "Profil",
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-around">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex min-w-0 flex-1 flex-col items-center
                rounded-xl px-2 py-2
                transition
                ${
                  isActive
                    ? "text-emerald-600"
                    : "text-slate-500 hover:text-slate-900"
                }
              `}
            >
              <span
                className={`
                  text-xl transition-transform
                  ${isActive ? "scale-110" : ""}
                `}
              >
                {item.icon}
              </span>

              <span
                className={`
                  mt-1 truncate text-[10px] sm:text-[11px]
                  ${
                    isActive
                      ? "font-bold"
                      : "font-medium"
                  }
                `}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}