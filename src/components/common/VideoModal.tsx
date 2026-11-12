import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  X,
  GripHorizontal,
  RotateCw,
  Server,
} from "lucide-react";
import { useVideoModal } from "../../context/VideoModalContext";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  embedUrl: string;
}

interface DragPosition {
  right: number;
  bottom: number;
}

const EDGE_PADDING = 24;
const PIP_WIDTH = 336;
const PIP_HEIGHT = 224;

const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  embedUrl,
}) => {
  const { title, sources, activeSourceKey, selectSource } = useVideoModal();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [position, setPosition] = useState<DragPosition>(() => ({
    right: EDGE_PADDING,
    bottom:
      typeof window !== "undefined" && window.innerWidth < 1024
        ? 132
        : EDGE_PADDING,
  }));

  const modalRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startRight: 0,
    startBottom: 0,
    currentRight: EDGE_PADDING,
    currentBottom: EDGE_PADDING,
  });

  // Extract origin of the current stream URL for <link rel="preconnect">
  const streamOrigin = useMemo(() => {
    if (!embedUrl) return null;
    try {
      return new URL(embedUrl).origin;
    } catch {
      return null;
    }
  }, [embedUrl]);

  useEffect(() => {
    setIframeLoaded(false);
  }, [embedUrl, reloadNonce]);

  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
      setIsDragging(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isMinimized) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isMinimized, onClose]);

  const getPadding = useCallback(() => {
    return window.innerWidth < 640 ? 12 : EDGE_PADDING;
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized((prev) => {
      if (!prev) {
        const pad = getPadding();
        const bottomPad =
          window.innerWidth < 1024 ? Math.max(pad, 128) : pad;
        setPosition({ right: pad, bottom: bottomPad });
      }
      return !prev;
    });
  }, [getPadding]);

  const preventScroll = useCallback((e: TouchEvent) => {
    e.preventDefault();
  }, []);

  const beginDrag = useCallback(
    (clientX: number, clientY: number) => {
      const rect = modalRef.current?.getBoundingClientRect();
      if (!rect) return false;

      const startRight = window.innerWidth - rect.right;
      const startBottom = window.innerHeight - rect.bottom;

      dragRef.current = {
        startX: clientX,
        startY: clientY,
        startRight,
        startBottom,
        currentRight: startRight,
        currentBottom: startBottom,
      };

      setIsDragging(true);
      return true;
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isMinimized) return;
      e.preventDefault();
      if (beginDrag(e.clientX, e.clientY)) {
        document.body.style.cursor = "grabbing";
      }
    },
    [isMinimized, beginDrag]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMinimized) return;
      const touch = e.touches[0];
      if (!touch) return;
      if (beginDrag(touch.clientX, touch.clientY)) {
        document.body.style.overflow = "hidden";
        document.addEventListener("touchmove", preventScroll, {
          passive: false,
        });
      }
    },
    [isMinimized, beginDrag, preventScroll]
  );

  // GPU-accelerated translate3d drag update (0 React re-renders during drag)
  const scheduleDragTransform = useCallback(
    (clientX: number, clientY: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const el = modalRef.current;
        if (!el) return;

        const padding = getPadding();
        const width = el.offsetWidth || PIP_WIDTH;
        const height = el.offsetHeight || PIP_HEIGHT;
        const maxRight = Math.max(padding, window.innerWidth - width - padding);
        const maxBottom = Math.max(
          padding,
          window.innerHeight - height - padding
        );

        const deltaX = clientX - dragRef.current.startX;
        const deltaY = clientY - dragRef.current.startY;

        const nextRight = Math.max(
          padding,
          Math.min(maxRight, dragRef.current.startRight - deltaX)
        );
        const nextBottom = Math.max(
          padding,
          Math.min(maxBottom, dragRef.current.startBottom - deltaY)
        );

        dragRef.current.currentRight = nextRight;
        dragRef.current.currentBottom = nextBottom;

        const tx = dragRef.current.startRight - nextRight;
        const ty = dragRef.current.startBottom - nextBottom;
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    },
    [getPadding]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      scheduleDragTransform(e.clientX, e.clientY);
    },
    [isDragging, scheduleDragTransform]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      if (touch) {
        scheduleDragTransform(touch.clientX, touch.clientY);
      }
    },
    [isDragging, scheduleDragTransform]
  );

  const handleDragEnd = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (modalRef.current) {
      modalRef.current.style.transform = "";
    }
    setPosition({
      right: dragRef.current.currentRight,
      bottom: dragRef.current.currentBottom,
    });
    setIsDragging(false);
    document.body.style.cursor = "";
    document.body.style.overflow = "";
    document.removeEventListener("touchmove", preventScroll);
  }, [preventScroll]);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleDragEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleDragEnd);
      document.body.style.cursor = "";
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", preventScroll);
    };
  }, [
    isDragging,
    handleMouseMove,
    handleDragEnd,
    handleTouchMove,
    preventScroll,
  ]);

  const openNewTab = useCallback(() => {
    window.open(embedUrl, "_blank", "noopener,noreferrer");
    onClose();
  }, [embedUrl, onClose]);

  const handleReloadStream = useCallback(() => {
    setIframeLoaded(false);
    setReloadNonce((n) => n + 1);
  }, []);

  return (
    <>
      {isOpen && streamOrigin && (
        <>
          <link rel="preconnect" href={streamOrigin} crossOrigin="anonymous" />
          <link rel="dns-prefetch" href={streamOrigin} />
        </>
      )}

      <AnimatePresence>
        {/* Theater backdrop when expanded */}
        {isOpen && !isMinimized && (
          <motion.div
            key="video-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          />
        )}

        {/* Player Shell */}
        {isOpen && (
          <div
            key="video-modal-positioner"
            className={`fixed z-50 pointer-events-none ${
              isMinimized
                ? ""
                : "inset-0 flex items-center justify-center p-2.5 sm:p-6"
            }`}
            style={
              isMinimized
                ? {
                    right: `${position.right}px`,
                    bottom: `${position.bottom}px`,
                  }
                : undefined
            }
          >
            <motion.div
              key="video-modal-shell"
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className={`pointer-events-auto ${
                isMinimized
                  ? "w-[310px] sm:w-[344px]"
                  : "w-full max-w-[min(64rem,calc((100dvh-6rem)*16/9))]"
              }`}
              style={{
                touchAction: isMinimized ? "none" : undefined,
              }}
            >
              {/* Dark Liquid Glass Frame (avoids nested backdrop-filter over 60fps video iframe) */}
              <div
                className={`flex flex-col overflow-hidden bg-[#141419]/95 border border-white/15 ${
                  isMinimized
                    ? "rounded-[22px] p-1.5 shadow-[inset_0_0_2px_1px_rgba(255,255,255,0.25),inset_0_0_10px_4px_rgba(255,255,255,0.10),0_24px_60px_-12px_rgba(0,0,0,0.92)]"
                    : "rounded-[26px] p-2 sm:p-2.5 shadow-[inset_0_0_2px_1px_rgba(255,255,255,0.25),inset_0_0_10px_4px_rgba(255,255,255,0.10),0_28px_80px_-14px_rgba(0,0,0,0.95)]"
                }`}
              >
                {/* Top Frosted Control Strip */}
                <div
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  className={`flex items-center justify-between gap-2 px-2.5 pb-2 pt-1 select-none ${
                    isMinimized ? "cursor-grab active:cursor-grabbing" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        iframeLoaded
                          ? "bg-emerald-400"
                          : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    <span className="text-xs font-medium tracking-wide text-neutral-200 truncate">
                      {isMinimized
                        ? title || "Mini Player"
                        : title
                        ? `Now Playing · ${title}`
                        : "Now Playing"}
                    </span>
                  </div>

                  {isMinimized && (
                    <GripHorizontal className="h-4 w-4 text-white/30 shrink-0" />
                  )}

                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={handleReloadStream}
                      title="Reload stream"
                      aria-label="Reload stream"
                      className="glass-chip flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                    >
                      <RotateCw
                        className={`h-3.5 w-3.5 ${
                          !iframeLoaded ? "animate-spin" : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={openNewTab}
                      title="Open in new tab"
                      aria-label="Open in new tab"
                      className="glass-chip flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleMinimize}
                      title={
                        isMinimized
                          ? "Expand player"
                          : "Minimize to mini player"
                      }
                      aria-label={
                        isMinimized ? "Expand player" : "Minimize player"
                      }
                      className="glass-chip flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                    >
                      {isMinimized ? (
                        <Maximize2 className="h-3.5 w-3.5" />
                      ) : (
                        <Minimize2 className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      title="Close player"
                      aria-label="Close player"
                      className="glass-chip flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Built-in Fast Server Switcher Bar (when streaming a movie/show) */}
                {!isMinimized && sources.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar px-2 pb-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 pr-1 shrink-0">
                      <Server className="w-3 h-3" />
                      <span>Server:</span>
                    </span>
                    {sources.map((src) => {
                      const active =
                        src.key === activeSourceKey || src.url === embedUrl;
                      return (
                        <button
                          key={src.key}
                          type="button"
                          onClick={() => selectSource(src)}
                          className={`shrink-0 rounded-full px-3 py-1 text-[11px] sm:text-xs font-medium transition-all border focus:outline-none ${
                            active
                              ? "bg-white/[0.18] text-white border-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                              : "bg-black/40 text-neutral-400 border-white/10 hover:text-white hover:bg-white/[0.08]"
                          }`}
                        >
                          {src.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Video Frame */}
                <div
                  className={`relative w-full aspect-video overflow-hidden bg-ink-950 ring-1 ring-white/10 ${
                    isMinimized ? "rounded-[16px]" : "rounded-[18px]"
                  }`}
                >
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-ink-950">
                      <div className="h-8 w-8 rounded-full border-2 border-white/15 border-t-white/85 animate-spin" />
                      {!isMinimized && (
                        <span className="text-xs text-neutral-400">
                          Connecting to stream… If slow, switch server above
                        </span>
                      )}
                    </div>
                  )}
                  <iframe
                    key={`${embedUrl}-${reloadNonce}`}
                    src={embedUrl}
                    title="Video Player"
                    className={`h-full w-full transition-opacity duration-200 ${
                      iframeLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    referrerPolicy="origin"
                    onLoad={() => setIframeLoaded(true)}
                  />
                  {/* Prevent iframe from stealing pointer events while dragging PiP */}
                  {isDragging && <div className="absolute inset-0 z-10" />}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(VideoModal);
