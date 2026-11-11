import React, { useState } from "react";
import { motion } from "framer-motion";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  count?: number;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const LIQUID_LENS_CLASS =
  "liquid-refract absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.24] via-white/[0.13] to-white/[0.07] border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_6px_16px_-4px_rgba(0,0,0,0.65)] pointer-events-none";

interface LiquidSegmentedControlProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Interactive segmented toggle group with a spring-animated liquid glass lens pill.
 */
export function LiquidSegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  layoutId,
  size = "sm",
  className = "",
}: LiquidSegmentedControlProps<T>) {
  const padClass =
    size === "sm"
      ? "px-3 py-1.5 text-xs sm:text-sm"
      : "px-4 py-2 text-xs sm:text-sm";

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={`relative inline-flex items-center gap-1.5 rounded-full font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${padClass} ${
              opt.disabled
                ? "text-neutral-600 cursor-not-allowed opacity-50"
                : isActive
                ? "text-white font-semibold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 36,
                  mass: 0.75,
                }}
                className={LIQUID_LENS_CLASS}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {opt.icon}
              <span>{opt.label}</span>
              {typeof opt.count === "number" && opt.count > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-white/[0.07] text-neutral-400"
                  }`}
                >
                  {opt.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface LiquidSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

/**
 * Range slider with an optically refracting glass pill thumb over a dark frosted track.
 */
export const LiquidSlider: React.FC<LiquidSliderProps> = ({
  min,
  max,
  value,
  onChange,
  ariaLabel = "Slider",
}) => {
  const [isEngaged, setIsEngaged] = useState(false);
  const clamped = Math.min(max, Math.max(min, value));
  const percent = max > min ? ((clamped - min) / (max - min)) * 100 : 0;

  return (
    <div className="relative flex items-center h-8 w-full select-none">
      {/* Frosted Track */}
      <div className="relative w-full h-2 rounded-full bg-white/10 border border-white/10 overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500/80 via-neutral-200/85 to-white"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Refractive Glass Lens Thumb */}
      <div
        aria-hidden="true"
        className={`liquid-refract pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/45 bg-gradient-to-b from-white/35 via-white/15 to-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_6px_16px_rgba(0,0,0,0.7)] transition-transform duration-200 ease-spring ${
          isEngaged ? "w-8 h-5 scale-110" : "w-7 h-4"
        }`}
        style={{ left: `${percent}%` }}
      />

      {/* Native Accessible Range Input */}
      <input
        type="range"
        min={min}
        max={max}
        value={clamped}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        onPointerDown={() => setIsEngaged(true)}
        onPointerUp={() => setIsEngaged(false)}
        onBlur={() => setIsEngaged(false)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
    </div>
  );
};
