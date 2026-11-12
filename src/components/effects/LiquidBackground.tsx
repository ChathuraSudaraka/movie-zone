import { useEffect } from "react";

export default function LiquidBackground() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    let frame = 0;
    let activeEl: HTMLElement | null = null;
    let cachedRect: DOMRect | null = null;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = (e.target as HTMLElement | null)?.closest?.(
        ".liquid-glass, .glass, .btn-glass"
      ) as HTMLElement | null;

      if (!target) {
        activeEl = null;
        cachedRect = null;
        return;
      }

      if (target !== activeEl) {
        activeEl = target;
        cachedRect = target.getBoundingClientRect();
      }

      if (frame || !cachedRect) return;
      const rect = cachedRect;
      const el = target;
      const x = e.clientX;
      const y = e.clientY;
      frame = requestAnimationFrame(() => {
        frame = 0;
        el.style.setProperty("--mx", `${x - rect.left}px`);
        el.style.setProperty("--my", `${y - rect.top}px`);
      });
    };

    const invalidateRect = () => {
      cachedRect = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", invalidateRect, { passive: true });
    window.addEventListener("resize", invalidateRect, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", invalidateRect);
      window.removeEventListener("resize", invalidateRect);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950"
    >
      <div
        className="absolute -left-[12%] -top-[18%] h-[65vmax] w-[65vmax] animate-blob-drift"
        style={{
          background:
            "radial-gradient(closest-side, rgba(168, 134, 96, 0.085), rgba(168, 134, 96, 0.025) 48%, transparent 72%)",
        }}
      />
      <div
        className="absolute -right-[15%] top-[18%] h-[55vmax] w-[55vmax] animate-blob-drift"
        style={{
          animationDelay: "-9s",
          animationDuration: "30s",
          background:
            "radial-gradient(closest-side, rgba(205, 210, 220, 0.045), rgba(205, 210, 220, 0.012) 50%, transparent 74%)",
        }}
      />
      <div
        className="absolute bottom-[-24%] left-[18%] h-[58vmax] w-[58vmax] animate-blob-drift"
        style={{
          animationDelay: "-16s",
          animationDuration: "36s",
          background:
            "radial-gradient(closest-side, rgba(124, 98, 72, 0.06), rgba(124, 98, 72, 0.015) 48%, transparent 72%)",
        }}
      />
      {/* Mobile soft ambient light glow */}
      <div
        className="lg:hidden absolute -top-[10%] -right-[20%] h-[68vw] w-[68vw]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(236, 72, 153, 0.16), rgba(168, 85, 247, 0.07) 50%, transparent 78%)",
        }}
      />
      <div
        className="lg:hidden absolute -bottom-[14%] -left-[18%] h-[78vw] w-[78vw]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(168, 85, 247, 0.18), rgba(236, 72, 153, 0.08) 50%, transparent 78%)",
        }}
      />
    </div>
  );
}
