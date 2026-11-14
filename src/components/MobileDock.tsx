import React from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Bookmark, Film, Heart, Home, Tv } from "lucide-react";

interface DockTab {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const DOCK_TABS: DockTab[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "tv", label: "TV", icon: Tv, href: "/tv" },
  { id: "movies", label: "Movies", icon: Film, href: "/movies" },
  { id: "my-list", label: "My List", icon: Bookmark, href: "/my-list" },
];

export const MobileDock: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isDonateActive = location.pathname === "/donate";
  const activeIndex = DOCK_TABS.findIndex(
    (tab) => tab.href === location.pathname
  );

  return (
    <div
      className="fixed bottom-3 inset-x-3.5 mx-auto max-w-[390px] z-40 lg:hidden pointer-events-auto"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        contain: "layout style",
      }}
    >
      {/* Soft vibrant pink & purple ambient glow underneath the dock */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 w-[92%] h-24 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(236, 72, 153, 0.48), rgba(168, 85, 247, 0.32) 48%, transparent 80%)",
        }}
      />

      {/* Outer Frosted Floating Shell (iOS 26 Dark Liquid Glass Dock) */}
      <div className="liquid-glass liquid-dock relative rounded-[36px] px-2 pt-2.5 pb-2">
        {/* Subtle top iOS capsule specular reflection */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-9 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-[35px] bg-gradient-to-b from-white/[0.09] via-white/[0.02] to-transparent"
        />

        {/* Luminous pink-purple under-rim accent */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/75 to-transparent"
        />

        {/* Top Nested Capsule Quick Action (Donate) */}
        <div className="flex justify-center mb-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => navigate("/donate")}
            className={`liquid-refract relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-[transform,color,border-color,background-color] duration-200 border focus:outline-none ${
              isDonateActive
                ? "bg-gradient-to-b from-white/[0.24] via-white/[0.12] to-white/[0.06] text-white border-white/40 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.48),0_6px_18px_-4px_rgba(0,0,0,0.65)]"
                : "bg-gradient-to-b from-white/[0.10] via-white/[0.04] to-black/35 text-white/90 border-white/20 hover:border-white/30 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.28),0_4px_14px_rgba(0,0,0,0.5)]"
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isDonateActive
                  ? "text-fuchsia-200 fill-fuchsia-300/70"
                  : "text-fuchsia-300"
              }`}
            />
            <span>Donate</span>
          </motion.button>
        </div>

        {/* Bottom 4-Tab Dark Frosted Glass Pill Track */}
        <nav
          aria-label="Mobile Navigation"
          className="relative grid grid-cols-4 items-center p-1 rounded-[28px] bg-black/45 border border-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_6px_16px_rgba(0,0,0,0.48)]"
        >
          {/* Single GPU-composited active tab lens pill (zero layout thrashing) */}
          {activeIndex >= 0 && (
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{ x: `${activeIndex * 100}%` }}
              transition={{
                type: "spring",
                stiffness: 480,
                damping: 34,
                mass: 0.75,
              }}
              style={{ width: "calc((100% - 8px) / 4)" }}
              className="liquid-refract pointer-events-none absolute inset-y-1 left-1 rounded-[24px] bg-gradient-to-b from-white/[0.28] via-white/[0.13] to-white/[0.06] border border-white/35 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.58),inset_0_0_10px_rgba(255,255,255,0.12),0_6px_18px_-4px_rgba(0,0,0,0.68)]"
            />
          )}

          {DOCK_TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const active = activeIndex === idx;
            return (
              <motion.button
                key={tab.id}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(tab.href)}
                className={`relative z-10 flex flex-col items-center justify-center gap-0.5 py-2 rounded-[24px] transition-colors duration-200 focus:outline-none ${
                  active
                    ? "text-white"
                    : "text-neutral-300/80 hover:text-white"
                }`}
              >
                <Icon
                  className={`relative z-10 w-[18px] h-[18px] transition-transform duration-200 ${
                    active ? "scale-105 text-white" : ""
                  }`}
                />
                <span className="relative z-10 text-[11px] font-medium tracking-tight leading-none mt-0.5">
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default MobileDock;
