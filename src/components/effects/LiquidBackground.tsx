import { useEffect, useMemo } from "react";

/**
 * Generates a smooth optical bezel displacement map (rounded-rectangle lens)
 * once in memory as a PNG data URL.
 *
 * Red channel = X displacement (128 = neutral)
 * Green channel = Y displacement (128 = neutral)
 *
 * The center remains optically flat (128, 128) so text stays razor-sharp,
 * while the outer curved bezel refracts light inward/outward like real
 * curved glass (no noisy feTurbulence, zero per-frame generation cost).
 */
function buildLensDisplacementMap(
  width: number,
  height: number,
  bezelRatio = 0.24,
  isCircular = false
): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(width, height);
  const data = img.data;
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2;
  const ry = height / 2;
  const cornerRadius = isCircular ? Math.min(rx, ry) : ry;
  const bezelPx = Math.min(rx, ry) * bezelRatio;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Signed distance to rounded-rectangle boundary (negative = inside)
      const qx = Math.abs(x - cx) - (rx - cornerRadius);
      const qy = Math.abs(y - cy) - (ry - cornerRadius);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const distOut =
        Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - cornerRadius;

      let nx = 0;
      let ny = 0;

      // Only bend light along the curved glass bezel
      const depth = -distOut;
      if (depth >= 0 && depth < bezelPx) {
        const t = 1 - depth / bezelPx; // 0 at inner edge -> 1 at rim
        // Smooth Snell-like convex surface slope
        const mag = Math.pow(t, 1.65) * Math.sin(t * Math.PI * 0.5);

        // Outward normal from rounded-rect SDF
        if (qx > 0 || qy > 0) {
          const len = Math.hypot(ox, oy) || 1;
          nx = (ox / len) * Math.sign(x - cx) * mag;
          ny = (oy / len) * Math.sign(y - cy) * mag;
        } else if (qx > qy) {
          nx = Math.sign(x - cx) * mag;
        } else {
          ny = Math.sign(y - cy) * mag;
        }
      }

      const idx = (y * width + x) * 4;
      data[idx] = Math.max(0, Math.min(255, Math.round(128 - nx * 127)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(128 - ny * 127)));
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

/**
 * Global iOS 26 Liquid Glass environment:
 *  - Pre-baked optical lens SVG filters (#liquid-pill-refract, #liquid-orb-refract)
 *  - Zero-blur radial-gradient ambient light field (0ms blur cost, 120fps)
 *  - Zero-reflow pointer specular tracking (caches element rect on hover)
 */
export default function LiquidBackground() {
  const { pillMap, orbMap } = useMemo(
    () => ({
      pillMap: buildLensDisplacementMap(256, 64, 0.32, false),
      orbMap: buildLensDisplacementMap(96, 96, 0.36, true),
    }),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip pointer specular tracking on touch-only devices
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
    <>
      {/* Zero-blur ambient light canvas: warm earthy tones & muted silver mist */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950"
      >
        <div
          className="absolute -left-[12%] -top-[18%] h-[65vmax] w-[65vmax] animate-blob-drift will-change-transform"
          style={{
            background:
              "radial-gradient(closest-side, rgba(168, 134, 96, 0.085), rgba(168, 134, 96, 0.025) 48%, transparent 72%)",
          }}
        />
        <div
          className="absolute -right-[15%] top-[18%] h-[55vmax] w-[55vmax] animate-blob-drift will-change-transform"
          style={{
            animationDelay: "-9s",
            animationDuration: "30s",
            background:
              "radial-gradient(closest-side, rgba(205, 210, 220, 0.045), rgba(205, 210, 220, 0.012) 50%, transparent 74%)",
          }}
        />
        <div
          className="absolute bottom-[-24%] left-[18%] h-[58vmax] w-[58vmax] animate-blob-drift will-change-transform"
          style={{
            animationDelay: "-16s",
            animationDuration: "36s",
            background:
              "radial-gradient(closest-side, rgba(124, 98, 72, 0.06), rgba(124, 98, 72, 0.015) 48%, transparent 72%)",
          }}
        />
        {/* Mobile vibrant pink & purple soft ambient light glow */}
        <div
          className="lg:hidden absolute -top-[10%] -right-[20%] h-[68vw] w-[68vw]"
          style={{
            background:
              "radial-gradient(closest-side, rgba(236, 72, 153, 0.20), rgba(168, 85, 247, 0.09) 50%, transparent 78%)",
          }}
        />
        <div
          className="lg:hidden absolute -bottom-[14%] -left-[18%] h-[78vw] w-[78vw]"
          style={{
            background:
              "radial-gradient(closest-side, rgba(168, 85, 247, 0.22), rgba(236, 72, 153, 0.10) 50%, transparent 78%)",
          }}
        />
      </div>

      {/* Static optical lens displacement filters (Chromium hardware-accelerated texture sample) */}
      <svg aria-hidden width="0" height="0" className="pointer-events-none fixed">
        <defs>
          {pillMap && (
            <filter
              id="liquid-pill-refract"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={pillMap}
                x="0%"
                y="0%"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                result="lensMap"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="lensMap"
                scale="18"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          )}
          {orbMap && (
            <filter
              id="liquid-orb-refract"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={orbMap}
                x="0%"
                y="0%"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                result="orbMap"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="orbMap"
                scale="14"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          )}
        </defs>
      </svg>
    </>
  );
}
