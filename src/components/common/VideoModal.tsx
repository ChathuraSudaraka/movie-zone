import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  X,
  GripHorizontal,
} from "lucide-react";

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

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, embedUrl }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [position, setPosition] = useState<DragPosition>(() => ({
    right: EDGE_PADDING,
    bottom:
      typeof window !== "undefined" && window.innerWidth < 1024
        ? 132
        : EDGE_PADDING,
  }));

  const modalRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startRight: 0,
    startBottom: 0,
  });

  useEffect(() => {
    setIframeLoaded(false);
  }, [embedUrl]);

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
        setPosition({ right: getPadding(), bottom: getPadding() });
      }
      return !prev;
    });
  }, [getPadding]);

  const preventScroll = useCallback((e: TouchEvent) => {
    e.preventDefault();
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isMinimized) return;
      e.preventDefault();

      const rect = modalRef.current?.getBoundingClientRect();
      if (!rect) return;

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startRight: window.innerWidth - rect.right,
        startBottom: window.innerHeight - rect.bottom,
      };

      setIsDragging(true);
      document.body.style.cursor = "grabbing";
    },
    [isMinimized]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMinimized) return;

      document.body.style.overflow = "hidden";
      document.addEventListener("touchmove", preventScroll, { passive: false });

      const rect = modalRef.current?.getBoundingClientRect();
      if (!rect) return;

      const touch = e.touches[0];
      dragRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startRight: window.innerWidth - rect.right,
        startBottom: window.innerHeight - rect.bottom,
      };

      setIsDragging(true);
    },
    [isMinimized, preventScroll]
  );

  const clampPosition = useCallback(
    (deltaX: number, deltaY: number) => {
      const padding = getPadding();
      const width = modalRef.current?.offsetWidth || PIP_WIDTH;
      const height = modalRef.current?.offsetHeight || PIP_HEIGHT;
      const maxRight = Math.max(padding, window.innerWidth - width - padding);
      const maxBottom = Math.max(padding, window.innerHeight - height - padding);

      setPosition({
        right: Math.max(
          padding,
          Math.min(maxRight, dragRef.current.startRight - deltaX)
        ),
        bottom: Math.max(
          padding,
          Math.min(maxBottom, dragRef.current.startBottom - deltaY)
        ),
      });
    },
    [getPadding]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      clampPosition(
        e.clientX - dragRef.current.startX,
        e.clientY - dragRef.current.startY
      );
    },
    [isDragging, clampPosition]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      clampPosition(
        touch.clientX - dragRef.current.startX,
        touch.clientY - dragRef.current.startY
      );
    },
    [isDragging, clampPosition]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = "";
    document.body.style.overflow = "";
    document.removeEventListener("touchmove", preventScroll);
  }, [preventScroll]);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleTouchMove);
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
  }, [isDragging, handleMouseMove, handleDragEnd, handleTouchMove, preventScroll]);

  const openNewTab = () => {
    window.open(embedUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <AnimatePresence>
      {/* Theater backdrop when expanded */}
      {isOpen && !isMinimized && (
        <motion.div
          key="video-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
        />
      )}

      {/* Player Shell */}
      {isOpen && (
        <div
          key="video-modal-positioner"
          className={`fixed z-50 pointer-events-none ${
            isMinimized
              ? ""
              : "inset-0 flex items-center justify-center p-3 sm:p-6"
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
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className={`pointer-events-auto ${
                isMinimized
                  ? "w-[310px] sm:w-[344px]"
                  : "w-full max-w-[min(64rem,calc((100dvh-6rem)*16/9))]"
              }`}
              style={{
                touchAction: isMinimized ? "none" : undefined,
              }}
            >
            <div
              className={`liquid-glass liquid-glass-strong flex flex-col overflow-hidden ${
                isMinimized
                  ? "rounded-[22px] p-1.5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.92)]"
                  : "rounded-[26px] p-2 sm:p-2.5 shadow-[0_28px_80px_-14px_rgba(0,0,0,0.95)]"
              }`}
            >
              {/* Top Frosted Control Strip (never overlaps the video content) */}
              <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className={`flex items-center justify-between gap-2 px-2.5 pb-2 pt-1 select-none ${
                  isMinimized ? "cursor-grab active:cursor-grabbing" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-brand-300 shrink-0" />
                  <span className="text-xs font-medium tracking-wide text-neutral-300 truncate">
                    {isMinimized ? "Mini Player" : "Now Playing"}
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
                    title={isMinimized ? "Expand player" : "Minimize to mini player"}
                    aria-label={isMinimized ? "Expand player" : "Minimize player"}
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

              {/* Video Frame */}
              <div
                className={`relative w-full aspect-video overflow-hidden bg-ink-950 ring-1 ring-white/10 ${
                  isMinimized ? "rounded-[16px]" : "rounded-[18px]"
                }`}
              >
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink-900">
                    <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
                  </div>
                )}
                <iframe
                  src={embedUrl}
                  title="Video Player"
                  className={`h-full w-full transition-opacity duration-300 ${
                    iframeLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
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
  );
};

export default React.memo(VideoModal);
