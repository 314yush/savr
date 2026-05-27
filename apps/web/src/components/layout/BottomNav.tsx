"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Home", href: "/" },
  { label: "Goals", href: "/goals" },
  { label: "Activity", href: "/activity" },
  { label: "Settings", href: "/settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#171719]/95 backdrop-blur-md border-t border-[#2C2C2E] pb-8 pt-3 px-8 flex justify-between items-center z-50">
      {tabs.map((tab) => {
        const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-1.5 w-16">
            <div
              className={`w-[22px] h-[22px] border-[1.5px] rounded-[4px] flex items-center justify-center ${
                isActive ? "border-white" : "border-[#636366]"
              }`}
            >
              {isActive && <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />}
            </div>
            <span
              className={`text-[11px] font-medium tracking-wide ${
                isActive ? "text-white font-semibold" : "text-[#636366]"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
