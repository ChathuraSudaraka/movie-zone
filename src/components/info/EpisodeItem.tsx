import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Calendar,
  Clock,
  Star,
  ChevronDown,
  Magnet,
  Download,
  Loader2,
  HardDrive,
} from "lucide-react";
import { TMDBEpisode } from "@/types/movie";
import { TorrentInfo } from "@/types/torrent";
import { useVideoModal } from "@/context/VideoModalContext";
import {
  formatTorrentQuality,
  getTorrentHealth,
} from "@/utils/torrentUtils";
import toast from "react-hot-toast";

interface EpisodeItemProps {
  episode: TMDBEpisode;
  onWatch: () => void;
  torrents?: TorrentInfo[];
  selectedQuality: string;
  imdbId?: string;
  tmdbId?: string;
  isLoadingTorrents?: boolean;
}

const SOURCE_OPTIONS = [
  { key: "primary", name: "VidSrc.to (Primary)" },
  { key: "secondary", name: "VidSrc.cc" },
  { key: "tertiary", name: "EmbedSu" },
  { key: "quaternary", name: "MovieLair" },
  { key: "fifth", name: "VidLink.pro" },
  { key: "fallback", name: "SmashyStream" },
];

const EpisodeItem: React.FC<EpisodeItemProps> = ({
  episode,
  torrents = [],
  imdbId,
  tmdbId,
  isLoadingTorrents = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const sourceRef = useRef<HTMLDivElement>(null);
  const { openModal } = useVideoModal();

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (
        sourceRef.current &&
        !sourceRef.current.contains(event.target as Node)
      ) {
        setShowSourceDropdown(false);
      }
    };
    if (showSourceDropdown) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showSourceDropdown]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "TBA";
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return "TBA";
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getVideoEmbedUrl = (source = "primary") => {
    if (!tmdbId || !episode?.season_number || !episode?.episode_number)
      return "";

    const sources = {
      primary: imdbId
        ? `https://vidsrc.to/embed/tv/${imdbId}/${episode.season_number}/${episode.episode_number}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${episode.season_number}/${episode.episode_number}`,
      secondary: `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${episode.season_number}/${episode.episode_number}`,
      tertiary: `https://embedsu.org/embed/tv/${tmdbId}/${episode.season_number}/${episode.episode_number}`,
      quaternary: `https://movielair.cc/watch-tv/${tmdbId}?season=${episode.season_number}&episode=${episode.episode_number}`,
      fifth: `https://vidlink.pro/tv/${tmdbId}/${episode.season_number}/${episode.episode_number}`,
      fallback: `https://player.smashy.stream/tv/${tmdbId}/${episode.season_number}/${episode.episode_number}`,
    };

    return sources[source as keyof typeof sources] || sources.primary;
  };

  const handlePlayClick = (sourceType: string = "primary") => {
    const sourceOrder = [
      "primary",
      "secondary",
      "tertiary",
      "quaternary",
      "fifth",
      "fallback",
    ];
    const startIndex = Math.max(0, sourceOrder.indexOf(sourceType));
    const orderedSources = [
      ...sourceOrder.slice(startIndex),
      ...sourceOrder.slice(0, startIndex),
    ];

    for (const source of orderedSources) {
      const embedUrl = getVideoEmbedUrl(source);
      if (embedUrl) {
        openModal(embedUrl);
        toast.success(`Playing Episode ${episode.episode_number}`);
        return;
      }
    }

    toast.error(
      `Episode ${episode.episode_number} is currently unavailable from all sources.`
    );
  };

  const epNum = String(episode.episode_number).padStart(2, "0");

  return (
    <div
      className={`glass-chip group relative flex flex-col p-4 sm:p-5 rounded-[22px] hover:border-white/25 transition-colors duration-200 ${
        showSourceDropdown ? "z-30" : ""
      }`}
    >
      {/* Episode Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          {episode.still_path ? (
            <button
              type="button"
              onClick={() => handlePlayClick("primary")}
              className="group/thumb relative shrink-0 w-28 sm:w-32 aspect-video rounded-[14px] overflow-hidden bg-white/[0.06] border border-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              title={`Watch Episode ${episode.episode_number}`}
            >
              <img
                src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                alt={episode.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <span className="absolute left-1.5 top-1.5 px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-sm border border-white/15 text-[10px] font-semibold text-white">
                EP {epNum}
              </span>
              <span className="absolute inset-0 flex items-center justify-center opacity-85 group-hover/thumb:opacity-100 transition-opacity">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/25 backdrop-blur-md border border-white/40 text-white shadow-lg group-hover/thumb:scale-110 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                </span>
              </span>
            </button>
          ) : (
            <div className="shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-[16px] bg-white/[0.06] border border-white/15">
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 leading-none">
                EP
              </span>
              <span className="text-base font-bold text-white leading-tight mt-0.5">
                {epNum}
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-white line-clamp-1">
              {episode.name}
            </h3>

            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 mt-1 text-xs text-neutral-400">
              {episode.vote_average > 0 && (
                <span className="inline-flex items-center gap-1 text-neutral-200 font-medium">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {episode.vote_average.toFixed(1)}
                </span>
              )}

              {episode.runtime && episode.runtime > 0 && (
                <span className="inline-flex items-center gap-1 text-neutral-300">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  {episode.runtime}m
                </span>
              )}

              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {formatDate(episode.air_date)}
              </span>

              {isLoadingTorrents ? (
                <span className="inline-flex items-center gap-1.5 text-neutral-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking links...
                </span>
              ) : torrents.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-300 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {torrents.length}{" "}
                  {torrents.length === 1 ? "download" : "downloads"} ready
                </span>
              ) : (
                <span className="text-neutral-500">Stream only</span>
              )}
            </div>
          </div>
        </div>

        {/* Episode Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Unified Watch Split Pill */}
          <div className="relative" ref={sourceRef}>
            <div className="btn-primary inline-flex h-9 items-center p-0 gap-0">
              <button
                onClick={() => handlePlayClick("primary")}
                className="flex h-full items-center gap-1.5 pl-3.5 pr-3 text-neutral-950 text-xs sm:text-sm font-semibold rounded-l-full hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/35"
              >
                <Play className="w-3.5 h-3.5 fill-neutral-950" />
                <span>Watch</span>
              </button>
              <span className="h-4 w-px bg-black/15" />
              <button
                onClick={() => setShowSourceDropdown((v) => !v)}
                className="flex h-full items-center justify-center pl-2.5 pr-3 rounded-r-full hover:opacity-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/35"
                aria-label="Choose streaming server"
                title="Choose streaming server"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showSourceDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {showSourceDropdown && (
              <div className="liquid-glass liquid-glass-strong absolute right-0 top-full mt-2 w-52 p-1.5 rounded-[20px] z-40">
                <div className="text-[10px] text-white/45 px-2.5 py-1.5 font-semibold uppercase tracking-wider">
                  Select Server
                </div>
                {SOURCE_OPTIONS.map((src) => (
                  <button
                    key={src.key}
                    onClick={() => {
                      handlePlayClick(src.key);
                      setShowSourceDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-[12px] text-xs sm:text-sm text-neutral-200 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {src.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Expand Downloads & Summary */}
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="btn-glass h-9 px-3.5 text-xs sm:text-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {torrents.length > 0
                ? `Downloads (${torrents.length})`
                : "Details"}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Overview + Download Cards */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
          {episode.overview ? (
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {episode.overview}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-neutral-500 italic">
              No episode summary available yet.
            </p>
          )}

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Episode Downloads
            </h4>

            {isLoadingTorrents ? (
              <div className="flex items-center justify-center gap-2.5 p-5 rounded-[16px] bg-white/[0.03] border border-white/10 text-neutral-300 text-xs sm:text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching for available download links...</span>
              </div>
            ) : torrents.length === 0 ? (
              <div className="p-4 rounded-[16px] bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-neutral-400">
                No download links found for this quality yet. You can still
                stream this episode using the <strong>Watch</strong> button
                above.
              </div>
            ) : (
              <div className="space-y-2">
                {torrents.map((torrent, index) => {
                  const seeds = Number(torrent.seeds) || 0;
                  const health = getTorrentHealth(seeds);
                  const qualityLabel = formatTorrentQuality(torrent.quality);

                  return (
                    <div
                      key={`${torrent.hash || index}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[16px] bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                        <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white font-semibold">
                          {qualityLabel}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-neutral-300">
                          <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
                          {torrent.size}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${health.dotClass}`}
                          />
                          <span className={`font-medium ${health.textClass}`}>
                            {health.label}
                          </span>
                          <span className="text-neutral-400 text-xs">
                            ({seeds} seeds)
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {torrent.download_url && (
                          <a
                            href={torrent.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-glass flex-1 sm:flex-initial px-3.5 py-2 text-xs sm:text-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>.torrent</span>
                          </a>
                        )}
                        <button
                          onClick={() => window.open(torrent.magnetLink)}
                          className="btn-primary flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm"
                        >
                          <Magnet className="w-3.5 h-3.5" />
                          <span>Magnet Link</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(EpisodeItem);
