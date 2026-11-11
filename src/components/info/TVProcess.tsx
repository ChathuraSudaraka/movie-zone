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
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [episodeCache, setEpisodeCache] = useState<{
    [season: number]: TMDBEpisode[];
  }>({});
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
    window.addEventListener("resize", checkNavigationNeeded);
    return () => window.removeEventListener("resize", checkNavigationNeeded);
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

  // Fetch seasons
  useEffect(() => {
    const fetchSeasons = async () => {
      if (!content?.id) return;
      setIsLoading(true);
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/tv/${content.id}?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }`
        );
        const filteredSeasons = (response.data.seasons || []).filter(
          (season: TMDBSeason) => season.season_number > 0
        );
        setSeasons(filteredSeasons);
        if (!selectedSeason && filteredSeasons.length > 0) {
          setSelectedSeason(filteredSeasons[0].season_number);
        }
      } catch (err) {
        console.error("Error fetching seasons:", err);
        setError("Failed to load seasons");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSeasons();
  }, [content?.id]);

  // Fetch torrents for one episode via EZTV
  const fetchTorrentsForEpisode = useCallback(
    async (
      imdbId: string,
      seasonNumber: number,
      episodeNumber: number
    ): Promise<TorrentInfo[] | null> => {
      try {
        const numericImdbId = imdbId.replace(/^tt/i, "");
        const response = await axios.get(
          `${EZTV_BASE_URL}/get-torrents?imdb_id=${numericImdbId}&limit=100`
        );

        if (!response.data?.torrents?.length) return null;

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

        const matched: EztvTorrent[] = response.data.torrents.filter(
          (t: EztvTorrent) =>
            parseInt(t.season) === seasonNumber &&
            parseInt(t.episode) === episodeNumber
        );

        if (!matched.length) return null;

        return matched
          .map((t: EztvTorrent) => ({
            url: t.torrent_url,
            hash: t.hash,
            quality: parseQuality(t.title),
            type: "web",
            seeds: t.seeds || 0,
            peers: t.peers || 0,
            size: t.size_bytes
              ? `${(parseInt(t.size_bytes) / 1073741824).toFixed(2)} GB`
              : "Unknown",
            infoHash: t.hash,
            provider: "EZTV",
            resolution: parseQuality(t.title),
            is_main_movie: false,
            download_url: t.torrent_url,
            magnetLink: t.magnet_url,
            trustScore: t.seeds > 50 ? 90 : t.seeds > 10 ? 70 : 50,
            size_bytes: parseInt(t.size_bytes) || 0,
            date_uploaded: new Date(
              t.date_released_unix * 1000
            ).toISOString(),
          }))
          .sort(
            (a: TorrentInfo, b: TorrentInfo) => (b.seeds || 0) - (a.seeds || 0)
          );
      } catch (err) {
        console.error(
          `Error fetching torrent S${seasonNumber}E${episodeNumber}:`,
          err
        );
        return null;
      }
    },
    []
  );

  // Fetch episodes + their torrents for a season
  const fetchEpisodesForSeason = useCallback(
    async (seasonNumber: number) => {
      if (!content?.id || !content?.imdb_id) return;

      let eps = episodeCache[seasonNumber];
      if (!eps) {
        setLoadingSeasons((prev) => [...prev, seasonNumber]);
        try {
          const episodesResponse = await axios.get(
            `https://api.themoviedb.org/3/tv/${
              content.id
            }/season/${seasonNumber}?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }`
          );
          eps = episodesResponse.data.episodes || [];
          setEpisodeCache((prev) => ({ ...prev, [seasonNumber]: eps }));
        } catch (err) {
          console.error(
            `Error fetching episodes for season ${seasonNumber}:`,
            err
          );
          setLoadingSeasons((prev) => prev.filter((s) => s !== seasonNumber));
          return;
        }
        setLoadingSeasons((prev) => prev.filter((s) => s !== seasonNumber));
      }

      if (seasonNumber === selectedSeason) {
        setEpisodes(eps);

        if (!torrentsBySeason[seasonNumber]) {
          const newTorrents: { [key: string]: TorrentInfo[] } = {};
          for (const episode of eps) {
            setLoadingTorrents((prev) => [...prev, episode.episode_number]);
            await delay(180);
            const torrentData = await fetchTorrentsForEpisode(
              content.imdb_id,
              seasonNumber,
              episode.episode_number
            );
            if (torrentData?.length) {
              newTorrents[episode.episode_number] = torrentData;
            }
            setLoadingTorrents((prev) =>
              prev.filter((id) => id !== episode.episode_number)
            );
          }
          setTorrentsBySeason((prev) => ({
            ...prev,
            [seasonNumber]: newTorrents,
          }));
        }
      }
    },
    [
      content?.id,
      content?.imdb_id,
      selectedSeason,
      episodeCache,
      torrentsBySeason,
      fetchTorrentsForEpisode,
    ]
  );

  useEffect(() => {
    if (selectedSeason) {
      fetchEpisodesForSeason(selectedSeason);
    }
  }, [selectedSeason, fetchEpisodesForSeason]);

  if (error) return <ErrorMessage message={error} />;
  if (isLoading) return <LoadingIndicator />;

  const currentTorrents = torrentsBySeason[selectedSeason] || {};

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

      {/* Episodes List */}
      {selectedSeason && episodes.length > 0 && (
        <EpisodeList
          episodes={episodes}
          selectedSeason={selectedSeason}
          onWatch={(episode) => {
            console.log("Watch episode:", episode);
          }}
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
