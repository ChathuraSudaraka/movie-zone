import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { LIQUID_LENS_CLASS } from "../common/LiquidGlassControls";
import { Movie, TMDBEpisode, TMDBSeason } from "../../types/movie";
import ErrorMessage from "./ErrorMessage";
import EpisodeList from "./EpisodeList";
import axios from "axios";
import { TorrentInfo } from "@/types/torrent";
import LoadingIndicator from "./LoadingIndicator";

interface TVProcessProps {
  content: Movie;
  selectedSeason: number;
  setSelectedSeason: (season: number) => void;
  selectedQuality: string;
  setSelectedQuality: (quality: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
}

const EZTV_BASE_URL = "/api/eztv";

interface EztvTorrent {
  id: number;
  title: string;
  season: string;
  episode: string;
  hash: string;
  magnet_url: string;
  torrent_url: string;
  size_bytes: string;
  seeds: number;
  peers: number;
  date_released_unix: number;
}

const EZTV_CACHE_MAX = 30;
const SEASON_EPISODES_CACHE_MAX = 50;

const eztvShowCache = new Map<
  string,
  { [season: number]: { [ep: number]: TorrentInfo[] } }
>();

const seasonEpisodesCache = new Map<string, TMDBEpisode[]>();

const EMPTY_SEASON_TORRENTS: { [ep: string]: TorrentInfo[] } = {};

function setBoundedMapEntry<T>(map: Map<string, T>, max: number, key: string, value: T) {
  if (map.has(key)) {
    map.delete(key);
  } else if (map.size >= max) {
    const oldestKey = map.keys().next().value;
    if (oldestKey !== undefined) {
      map.delete(oldestKey);
    }
  }
  map.set(key, value);
}

function parseQuality(title: string): string {
  if (/2160p|4k/i.test(title)) return "2160p";
  if (/1080p/i.test(title)) return "1080p";
  if (/720p/i.test(title)) return "720p";
  if (/480p/i.test(title)) return "480p";
  return "Unknown";
}

export const TVProcess = ({
  content,
  selectedSeason,
  setSelectedSeason,
  selectedQuality,
  setSelectedQuality,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}: TVProcessProps) => {
  const [seasons, setSeasons] = useState<TMDBSeason[]>([]);
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [torrentsBySeason, setTorrentsBySeason] = useState<{
    [season: number]: { [ep: string]: TorrentInfo[] };
  }>({});
  const torrentsBySeasonRef = useRef<{
    [season: number]: { [ep: string]: TorrentInfo[] };
  }>({});
  const prevContentIdRef = useRef(content?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSeasons, setLoadingSeasons] = useState<number[]>([]);
  const [loadingTorrents, setLoadingTorrents] = useState<number[]>([]);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const seasonListRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showNavigation, setShowNavigation] = useState(false);

  const scrollSeasons = (direction: "left" | "right") => {
    if (!seasonListRef.current) return;
    const scrollAmount = 280;
    const currentScroll = seasonListRef.current.scrollLeft;
    seasonListRef.current.scrollTo({
      left:
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount,
      behavior: "smooth",
    });
  };

  const checkNavigationNeeded = useCallback(() => {
    if (seasonListRef.current) {
      const { scrollWidth, clientWidth } = seasonListRef.current;
      setShowNavigation(scrollWidth > clientWidth);
    }
  }, []);

  useEffect(() => {
    checkNavigationNeeded();
    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        checkNavigationNeeded();
      });
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [checkNavigationNeeded, seasons]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsSeasonDropdownOpen(false);
      }
    };
    if (isSeasonDropdownOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isSeasonDropdownOpen]);

  // Reset per-show season torrent/episode state if content.id changes without unmount
  useEffect(() => {
    if (prevContentIdRef.current !== content?.id) {
      prevContentIdRef.current = content?.id;
      torrentsBySeasonRef.current = {};
      setTorrentsBySeason({});
      setEpisodes([]);
    }
  }, [content?.id]);

  // Fetch seasons (reuse content.seasons when already present from Info.tsx)
  useEffect(() => {
    if (!content?.id) return;
    const controller = new AbortController();

    const fetchSeasons = async () => {
      const embeddedSeasons = (
        content as Movie & { seasons?: TMDBSeason[] }
      ).seasons;
      if (Array.isArray(embeddedSeasons) && embeddedSeasons.length > 0) {
        const filtered = embeddedSeasons.filter((s) => s.season_number > 0);
        setSeasons(filtered);
        if (!selectedSeason && filtered.length > 0) {
          setSelectedSeason(filtered[0].season_number);
        }
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/tv/${content.id}?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }`,
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        const filteredSeasons = (response.data.seasons || []).filter(
          (season: TMDBSeason) => season.season_number > 0
        );
        setSeasons(filteredSeasons);
        if (!selectedSeason && filteredSeasons.length > 0) {
          setSelectedSeason(filteredSeasons[0].season_number);
        }
      } catch (err) {
        if (controller.signal.aborted || axios.isCancel(err)) return;
        console.error("Error fetching seasons:", err);
        setError("Failed to load seasons");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    fetchSeasons();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content?.id]);

  // Fetch all EZTV torrents for the show once and group by season + episode
  const fetchShowTorrents = useCallback(
    async (
      imdbId: string,
      signal?: AbortSignal
    ): Promise<{ [season: number]: { [ep: number]: TorrentInfo[] } } | null> => {
      const numericImdbId = imdbId.replace(/^tt/i, "");
      if (!numericImdbId) return {};
      if (eztvShowCache.has(numericImdbId)) {
        return eztvShowCache.get(numericImdbId)!;
      }

      try {
        const response = await axios.get(
          `${EZTV_BASE_URL}/get-torrents?imdb_id=${numericImdbId}&limit=100`,
          { signal }
        );
        if (signal?.aborted) return null;
        const rawTorrents: EztvTorrent[] = response.data?.torrents || [];
        const grouped: { [season: number]: { [ep: number]: TorrentInfo[] } } =
          {};

        for (const t of rawTorrents) {
          const sNum = parseInt(t.season, 10);
          const eNum = parseInt(t.episode, 10);
          if (!sNum || !eNum) continue;
          if (!grouped[sNum]) grouped[sNum] = {};
          if (!grouped[sNum][eNum]) grouped[sNum][eNum] = [];

          grouped[sNum][eNum].push({
            url: t.torrent_url,
            hash: t.hash,
            quality: parseQuality(t.title),
            type: "web",
            seeds: t.seeds || 0,
            peers: t.peers || 0,
            size: t.size_bytes
              ? `${(parseInt(t.size_bytes, 10) / 1073741824).toFixed(2)} GB`
              : "Unknown",
            infoHash: t.hash,
            provider: "EZTV",
            resolution: parseQuality(t.title),
            is_main_movie: false,
            download_url: t.torrent_url,
            magnetLink: t.magnet_url,
            trustScore: t.seeds > 50 ? 90 : t.seeds > 10 ? 70 : 50,
            size_bytes: parseInt(t.size_bytes, 10) || 0,
            date_uploaded: new Date(
              t.date_released_unix * 1000
            ).toISOString(),
          });
        }

        for (const sKey of Object.keys(grouped)) {
          const sMap = grouped[Number(sKey)];
          for (const eKey of Object.keys(sMap)) {
            sMap[Number(eKey)].sort((a, b) => (b.seeds || 0) - (a.seeds || 0));
          }
        }

        setBoundedMapEntry(eztvShowCache, EZTV_CACHE_MAX, numericImdbId, grouped);
        return grouped;
      } catch (err) {
        if (signal?.aborted || axios.isCancel(err)) return null;
        console.error("Error fetching EZTV show torrents:", err);
        return {};
      }
    },
    []
  );

  // Fetch episodes + their torrents for a season
  const fetchEpisodesForSeason = useCallback(
    async (seasonNumber: number, signal?: AbortSignal) => {
      if (!content?.id) return;

      const cacheKey = `${content.id}:${seasonNumber}`;
      let eps = seasonEpisodesCache.get(cacheKey);
      if (!eps) {
        setLoadingSeasons((prev) =>
          prev.includes(seasonNumber) ? prev : [...prev, seasonNumber]
        );
        try {
          const episodesResponse = await axios.get(
            `https://api.themoviedb.org/3/tv/${
              content.id
            }/season/${seasonNumber}?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }`,
            { signal }
          );
          if (signal?.aborted) return;
          const fetchedEps: TMDBEpisode[] =
            episodesResponse.data.episodes || [];
          eps = fetchedEps;
          setBoundedMapEntry(
            seasonEpisodesCache,
            SEASON_EPISODES_CACHE_MAX,
            cacheKey,
            fetchedEps
          );
        } catch (err) {
          if (signal?.aborted || axios.isCancel(err)) return;
          console.error(
            `Error fetching episodes for season ${seasonNumber}:`,
            err
          );
          return;
        } finally {
          setLoadingSeasons((prev) => prev.filter((s) => s !== seasonNumber));
        }
      }

      if (signal?.aborted) return;
      setEpisodes(eps);

      if (content.imdb_id && !torrentsBySeasonRef.current[seasonNumber]) {
        const allGrouped = await fetchShowTorrents(content.imdb_id, signal);
        if (signal?.aborted || !allGrouped) return;
        const nextTorrents = {
          ...torrentsBySeasonRef.current,
          ...allGrouped,
          [seasonNumber]: allGrouped[seasonNumber] || {},
        };
        torrentsBySeasonRef.current = nextTorrents;
        setTorrentsBySeason(nextTorrents);
        setLoadingTorrents([]);
      }
    },
    [content?.id, content?.imdb_id, fetchShowTorrents]
  );

  useEffect(() => {
    if (!selectedSeason) return;
    const controller = new AbortController();
    fetchEpisodesForSeason(selectedSeason, controller.signal);
    return () => controller.abort();
  }, [selectedSeason, fetchEpisodesForSeason]);

  const handleWatchEpisode = useCallback((episode: TMDBEpisode) => {
    console.log("Watch episode:", episode);
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (isLoading) return <LoadingIndicator />;

  const currentTorrents =
    torrentsBySeason[selectedSeason] || EMPTY_SEASON_TORRENTS;
  const activeSeasonMeta = seasons.find(
    (s) => s.season_number === selectedSeason
  );

  return (
    <div className="space-y-6">
      {/* Season Selector */}
      <div className="relative z-20" ref={dropdownRef}>
        {/* Mobile Frosted Dropdown */}
        <div className="md:hidden">
          <button
            onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
            className="glass-chip w-full flex items-center justify-between gap-2 px-4 py-3 rounded-[18px] text-white"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                Season
              </span>
              <span className="text-sm font-semibold text-white">
                Season {selectedSeason || 1}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-neutral-300 transition-transform duration-200 ${
                isSeasonDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isSeasonDropdownOpen && (
            <div className="liquid-glass liquid-glass-strong absolute z-40 w-full mt-2 p-2 rounded-[20px] max-h-[60vh] overflow-y-auto space-y-1">
              {seasons.map((season) => {
                const active = selectedSeason === season.season_number;
                const isSeasonLoading = loadingSeasons.includes(
                  season.season_number
                );
                return (
                  <button
                    key={season.season_number}
                    onClick={() => {
                      setSelectedSeason(season.season_number);
                      setIsSeasonDropdownOpen(false);
                    }}
                    disabled={isSeasonLoading}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[14px] text-sm transition-colors ${
                      active
                        ? "bg-white text-neutral-950 font-semibold"
                        : "text-neutral-200 hover:bg-white/10"
                    }`}
                  >
                    <span>Season {season.season_number}</span>
                    {isSeasonLoading && (
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Frosted Season Tabs */}
        <div className="hidden md:block">
          <div className="glass-chip relative flex items-center rounded-[20px] p-1.5">
            {showNavigation && (
              <button
                onClick={() => scrollSeasons("left")}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0 mr-1 transition-colors"
                aria-label="Scroll seasons left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div
              ref={seasonListRef}
              className="flex flex-nowrap gap-1.5 overflow-x-auto scrollbar-none scroll-smooth flex-1"
            >
              {seasons.map((season) => {
                const active = selectedSeason === season.season_number;
                const isSeasonLoading = loadingSeasons.includes(
                  season.season_number
                );
                return (
                  <button
                    key={season.season_number}
                    onClick={() => setSelectedSeason(season.season_number)}
                    disabled={isSeasonLoading}
                    className={`relative flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                      active
                        ? "text-white font-semibold"
                        : "text-neutral-400 hover:text-neutral-200"
                    } ${isSeasonLoading ? "opacity-60" : ""}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="tv-season-tab-lens"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 36,
                          mass: 0.75,
                        }}
                        className={LIQUID_LENS_CLASS}
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-2">
                      {isSeasonLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <span>Season {season.season_number}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {showNavigation && (
              <button
                onClick={() => scrollSeasons("right")}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0 ml-1 transition-colors"
                aria-label="Scroll seasons right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Season Overview Strip */}
      {activeSeasonMeta && (activeSeasonMeta.overview || activeSeasonMeta.air_date) && (
        <div className="glass-chip flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-[18px]">
          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-white">
              <span>{activeSeasonMeta.name || `Season ${selectedSeason}`}</span>
              {activeSeasonMeta.air_date && (
                <span className="text-xs font-normal text-neutral-400">
                  ({new Date(activeSeasonMeta.air_date).getFullYear()})
                </span>
              )}
              {activeSeasonMeta.episode_count > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-medium text-neutral-300">
                  {activeSeasonMeta.episode_count} Episodes
                </span>
              )}
            </div>
            {activeSeasonMeta.overview && (
              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                {activeSeasonMeta.overview}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Episodes List */}
      {selectedSeason && episodes.length > 0 && (
        <EpisodeList
          episodes={episodes}
          selectedSeason={selectedSeason}
          onWatch={handleWatchEpisode}
          torrents={currentTorrents}
          selectedQuality={selectedQuality}
          setSelectedQuality={setSelectedQuality}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          imdbId={content?.imdb_id}
          tmdbId={content?.id?.toString()}
          loadingTorrents={loadingTorrents}
        />
      )}
    </div>
  );
};

export default TVProcess;
