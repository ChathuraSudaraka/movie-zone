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
  const activeTabId =
    DOCK_TABS.find((tab) => tab.href === location.pathname)?.id ?? null;

  return (
    <div
      className="fixed bottom-3 inset-x-3.5 mx-auto max-w-[390px] z-40 lg:hidden pointer-events-auto"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Soft vibrant pink & purple ambient glow underneath the dock */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 w-[92%] h-24 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(236, 72, 153, 0.50), rgba(168, 85, 247, 0.34) 48%, transparent 80%)",
        }}
      />

      {/* Outer Frosted Floating Shell (True Liquid Glass Dock Preset) */}
      <div className="liquid-glass liquid-dock relative rounded-[36px] px-2 pt-2.5 pb-2">
        {/* Luminous pink-purple under-rim accent */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/80 to-transparent"
        />

        {/* Top Nested Capsule Quick Action (Donate) */}
        <div className="flex justify-center mb-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => navigate("/donate")}
            className={`liquid-refract relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border focus:outline-none ${
              isDonateActive
                ? "bg-white/[0.16] text-white border-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_18px_-4px_rgba(0,0,0,0.65)]"
                : "bg-black/35 text-white/90 border-white/15 hover:bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_6px_16px_rgba(0,0,0,0.55)]"
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
          className="grid grid-cols-4 items-center p-1 rounded-[28px] bg-black/40 border border-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_6px_16px_rgba(0,0,0,0.45)]"
        >
          {DOCK_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTabId === tab.id;
            return (
              <motion.button
                key={tab.id}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(tab.href)}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 rounded-[24px] transition-colors duration-200 focus:outline-none ${
                  active
                    ? "text-white"
                    : "text-neutral-300/80 hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-dock-lens"
                    transition={{
                      type: "spring",
                      stiffness: 480,
                      damping: 34,
                      mass: 0.75,
                    }}
                    className="liquid-refract absolute inset-0 rounded-[24px] bg-gradient-to-b from-white/[0.22] via-white/[0.10] to-white/[0.06] border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.48),0_6px_18px_-4px_rgba(0,0,0,0.65)] pointer-events-none"
                  />
                )}
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
