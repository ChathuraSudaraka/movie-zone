import { useEffect, useState, useCallback, useRef } from "react";
import {
  FaChevronDown,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
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

// EZTV API is proxied via /api/eztv in vite.config.ts
const EZTV_BASE_URL = "/api/eztv";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Normalise quality string from EZTV title */
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
  const [torrents, setTorrents] = useState<{ [key: string]: TorrentInfo[] }>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [episodeCache, setEpisodeCache] = useState<{
    [key: string]: TMDBEpisode[];
  }>({});
  const [loadingSeasons, setLoadingSeasons] = useState<number[]>([]);
  const [loadingTorrents, setLoadingTorrents] = useState<number[]>([]);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const seasonListRef = useRef<HTMLDivElement>(null);
  const [showNavigation, setShowNavigation] = useState(false);

  const scrollSeasons = (direction: "left" | "right") => {
    if (seasonListRef.current) {
      const scrollAmount = 300;
      const currentScroll = seasonListRef.current.scrollLeft;
      seasonListRef.current.scrollTo({
        left:
          direction === "left"
            ? currentScroll - scrollAmount
            : currentScroll + scrollAmount,
        behavior: "smooth",
      });
    }
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

  // ── Fetch seasons ──────────────────────────────────────────────────────────
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

  // ── Fetch torrents for one episode via EZTV ────────────────────────────────
  const fetchTorrentsForEpisode = useCallback(
    async (
      imdbId: string,
      seasonNumber: number,
      episodeNumber: number
    ): Promise<TorrentInfo[] | null> => {
      try {
        // EZTV expects a numeric imdb id (strip leading "tt")
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

        // Filter to the exact season + episode
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
        console.error(`Error fetching torrent S${seasonNumber}E${episodeNumber}:`, err);
        return null;
      }
    },
    []
  );

  // ── Fetch episodes + their torrents for a season ───────────────────────────
  const fetchEpisodesForSeason = useCallback(
    async (seasonNumber: number) => {
      if (!content?.id || !content?.imdb_id || episodeCache[seasonNumber])
        return;

      setLoadingSeasons((prev) => [...prev, seasonNumber]);
      try {
        const episodesResponse = await axios.get(
          `https://api.themoviedb.org/3/tv/${
            content.id
          }/season/${seasonNumber}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
        );

        const eps: TMDBEpisode[] = episodesResponse.data.episodes;
        setEpisodeCache((prev) => ({ ...prev, [seasonNumber]: eps }));

        if (seasonNumber === selectedSeason) {
          setEpisodes(eps);

          // Fetch EZTV torrents for all episodes in this season
          const newTorrents: { [key: string]: TorrentInfo[] } = {};
          for (const episode of eps) {
            setLoadingTorrents((prev) => [...prev, episode.episode_number]);
            await delay(200); // gentle rate limiting
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
          setTorrents(newTorrents);
        }
      } catch (err) {
        console.error(`Error fetching episodes for season ${seasonNumber}:`, err);
      } finally {
        setLoadingSeasons((prev) => prev.filter((s) => s !== seasonNumber));
      }
    },
    [content?.id, content?.imdb_id, selectedSeason, episodeCache, fetchTorrentsForEpisode]
  );

  // Handle season change
  useEffect(() => {
    if (selectedSeason) {
      if (episodeCache[selectedSeason]) {
        setEpisodes(episodeCache[selectedSeason]);
      } else {
        fetchEpisodesForSeason(selectedSeason);
      }
    }
  }, [selectedSeason, fetchEpisodesForSeason]);

  // Pre-fetch next season
  useEffect(() => {
    if (selectedSeason && seasons.length > 0) {
      const nextSeason = selectedSeason + 1;
      if (seasons.find((s) => s.season_number === nextSeason)) {
        fetchEpisodesForSeason(nextSeason);
      }
    }
  }, [selectedSeason, seasons, fetchEpisodesForSeason]);

  if (error) return <ErrorMessage message={error} />;
  if (isLoading) return <LoadingIndicator />;

  return (
    <div className="space-y-8">
      {/* Season Selector */}
      <div className="relative">
        {/* Mobile Dropdown */}
        <div className="md:hidden">
          <button
            onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3
                       bg-[#1a1a1a]/90 hover:bg-[#232323]/90 
                       border-2 border-red-500/30 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-red-500">Season</span>
              <span className="text-sm font-medium text-white">
                {selectedSeason || "1"}
              </span>
            </div>
            <FaChevronDown
              className={`w-4 h-4 text-red-500 transition-transform duration-200
              ${isSeasonDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isSeasonDropdownOpen && (
            <div
              className="absolute z-50 w-full mt-2 py-2 
                           bg-[#1a1a1a]/95 border border-gray-800/50 rounded-xl 
                           backdrop-blur-sm shadow-xl max-h-[60vh] overflow-y-auto"
            >
              {seasons.map((season) => (
                <button
                  key={season.season_number}
                  onClick={() => {
                    setSelectedSeason(season.season_number);
                    setIsSeasonDropdownOpen(false);
                  }}
                  disabled={loadingSeasons.includes(season.season_number)}
                  className={`w-full flex items-center justify-between px-4 py-3
                    ${
                      selectedSeason === season.season_number
                        ? "bg-red-500/20 text-red-500"
                        : "text-gray-300 hover:bg-gray-800/50"
                    }`}
                >
                  <span className="text-sm font-medium">
                    Season {season.season_number}
                  </span>
                  {loadingSeasons.includes(season.season_number) && (
                    <FaSpinner className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Season List */}
        <div className="hidden md:block">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent rounded-xl" />

            {showNavigation && (
              <button
                onClick={() => scrollSeasons("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                           w-8 h-8 flex items-center justify-center
                           bg-black/60 hover:bg-red-500/90 
                           rounded-full shadow-lg transform transition-all
                           text-white border border-red-500/30"
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div
              ref={seasonListRef}
              className={`flex flex-nowrap gap-3 p-4 overflow-x-auto scrollbar-none
                         scroll-smooth ${showNavigation ? "mx-10" : ""}`}
            >
              {seasons.map((season) => (
                <button
                  key={season.season_number}
                  onClick={() => setSelectedSeason(season.season_number)}
                  disabled={loadingSeasons.includes(season.season_number)}
                  className={`flex-shrink-0 flex items-center gap-2.5 px-8 py-3 rounded-lg
                             text-sm font-medium transition-all duration-300
                             backdrop-blur-sm transform hover:scale-105
                    ${
                      selectedSeason === season.season_number
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30 border-2 border-red-500"
                        : "bg-black/40 hover:bg-red-500/90 border-2 border-red-500/20 text-red-500 hover:text-white hover:border-red-500/50"
                    } ${
                    loadingSeasons.includes(season.season_number)
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  {loadingSeasons.includes(season.season_number) ? (
                    <div className="flex items-center gap-2">
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <span>Season {season.season_number}</span>
                  )}
                </button>
              ))}
            </div>

            {showNavigation && (
              <button
                onClick={() => scrollSeasons("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                           w-8 h-8 flex items-center justify-center
                           bg-black/60 hover:bg-red-500/90 
                           rounded-full shadow-lg transform transition-all
                           text-white border border-red-500/30"
              >
                <FaChevronRight className="w-4 h-4" />
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
          torrents={torrents}
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
