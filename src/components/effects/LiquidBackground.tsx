import { useEffect } from "react";

const BACKGROUND_GRADIENTS = [
  "radial-gradient(32.5vmax 32.5vmax at 12% 10%, rgba(168, 134, 96, 0.085), rgba(168, 134, 96, 0.025) 48%, transparent 72%)",
  "radial-gradient(27.5vmax 27.5vmax at 88% 42%, rgba(205, 210, 220, 0.045), rgba(205, 210, 220, 0.012) 50%, transparent 74%)",
  "radial-gradient(29vmax 29vmax at 46% 96%, rgba(124, 98, 72, 0.06), rgba(124, 98, 72, 0.015) 48%, transparent 72%)",
  "radial-gradient(34vw 34vw at 86% 12%, rgba(236, 72, 153, 0.10), rgba(168, 85, 247, 0.045) 50%, transparent 78%)",
  "radial-gradient(39vw 39vw at 16% 88%, rgba(168, 85, 247, 0.11), rgba(236, 72, 153, 0.05) 50%, transparent 78%)",
  "#050507",
].join(", ");

export default function LiquidBackground() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
    const isLowRam =
      (typeof deviceMemory === "number" && deviceMemory <= 4) ||
      (typeof navigator.hardwareConcurrency === "number" &&
        navigator.hardwareConcurrency <= 4) ||
      window.matchMedia("(hover: none), (max-width: 1023px)").matches;

    if (isLowRam) {
      document.documentElement.dataset.lowRam = "true";
    } else {
      delete document.documentElement.dataset.lowRam;
    }

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
      className="fixed inset-0 -z-10 pointer-events-none bg-ink-950"
      style={{ background: BACKGROUND_GRADIENTS }}
    />
  );
}
