import React from "react";
import { Download, Magnet, HardDrive, Users, Sparkles } from "lucide-react";
import { TorrentInfo } from "../../types/torrent";
import {
  formatTorrentQuality,
  getTorrentHealth,
} from "../../utils/torrentUtils";

interface TorrentItemProps {
  torrent: TorrentInfo;
  onDownload: (torrent: TorrentInfo) => void;
  onMagnetDownload: (torrent: TorrentInfo) => void;
  isRecommended?: boolean;
}

const formatSize = (size: string) =>
  size
    ? size
        .replace(/\s*bytes/i, "B")
        .replace(/\s*gigabytes/i, " GB")
        .replace(/\s*megabytes/i, " MB")
    : "Unknown";

const formatType = (type: string) => {
  if (!type) return "Standard";
  const lower = type.toLowerCase();
  if (lower === "bluray") return "BluRay";
  if (lower === "web") return "WEB-DL";
  return type.toUpperCase();
};

export const TorrentItem: React.FC<TorrentItemProps> = ({
  torrent,
  onDownload,
  onMagnetDownload,
  isRecommended = false,
}) => {
  const seeds = Number(torrent.seeds) || 0;
  const peers = Number(torrent.peers) || 0;
  const health = getTorrentHealth(seeds);
  const qualityLabel = formatTorrentQuality(torrent.quality);

  return (
    <div className="glass-chip group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:px-5 sm:py-4 rounded-[20px] hover:border-white/25 transition-colors duration-200">
      {/* Left: Quality + Format + Recommended Badge */}
      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs sm:text-sm font-semibold tracking-tight">
          {qualityLabel}
        </span>

        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium">
          {formatType(torrent.type)}
        </span>

        {isRecommended && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 text-[11px] font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Recommended</span>
          </span>
        )}
      </div>

      {/* Middle: Clear Labeled Metrics */}
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
          <span className="text-[11px] text-neutral-500 sm:hidden">Size</span>
          <div className="flex items-center gap-1.5 text-neutral-200 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>{formatSize(torrent.size)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
          <span className="text-[11px] text-neutral-500 sm:hidden">Health</span>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full shrink-0 ${health.dotClass}`} />
            <span className={`font-medium ${health.textClass}`}>
              {health.label}
            </span>
            <span className="text-neutral-400 text-xs">({seeds} seeds)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
          <span className="text-[11px] text-neutral-500 sm:hidden">Peers</span>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>{peers} peers</span>
          </div>
        </div>
      </div>

      {/* Right: Download Buttons */}
      <div className="flex items-center gap-2 w-full md:w-auto pt-1 md:pt-0">
        <button
          onClick={() => onDownload(torrent)}
          className="btn-primary flex-1 md:flex-initial px-4 py-2 text-xs sm:text-sm"
          title="Download .torrent file"
        >
          <Download className="w-3.5 h-3.5" />
          <span>.torrent</span>
        </button>
        <button
          onClick={() => onMagnetDownload(torrent)}
          className="btn-glass flex-1 md:flex-initial px-4 py-2 text-xs sm:text-sm"
          title="Open Magnet Link in your torrent client"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span>Magnet</span>
        </button>
      </div>
    </div>
  );
};
