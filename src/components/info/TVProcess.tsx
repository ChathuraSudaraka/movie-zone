import { useEffect, useState, useCallback } from "react";
import { FaChevronDown, FaSpinner } from 'react-icons/fa';
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

const TORRENTIO_BASE_URL = "/api/torrentio";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  // Fetch seasons only once
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
        // Filter out season 0
        const filteredSeasons = (response.data.seasons || []).filter(
          (season: TMDBSeason) => season.season_number > 0
        );
        setSeasons(filteredSeasons);
        // Auto-select first season if none selected
        if (!selectedSeason && filteredSeasons.length > 0) {
          setSelectedSeason(filteredSeasons[0].season_number);
        }
      } catch (error) {
        console.error("Error fetching seasons:", error);
        setError("Failed to load seasons");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeasons();
  }, [content?.id]);

  const fetchTorrents = useCallback(
    async (imdbId: string, seasonNumber: number, episodeNumber: number) => {
      try {
        const response = await axios.get(
          `${TORRENTIO_BASE_URL}/stream/series/${imdbId}:${seasonNumber}:${episodeNumber}.json`
        );

        if (!response.data?.streams?.length) return null;

        return response.data.streams
          .map((stream: any) => ({
            infoHash: stream.infoHash,
            quality:
              stream.title.match(/\b(2160p|1080p|720p|480p)\b/i)?.[1] ||
              "Unknown",
            size: stream.title.match(/\{(.*?)\}/)?.[1] || "Unknown",
            seeds: parseInt(stream.title.match(/Seeds: (\d+)/)?.[1] || "0"),
            peers: parseInt(stream.title.match(/Peers: (\d+)/)?.[1] || "0"),
            provider: stream.title.split("\n")[0],
            title: stream.title,
            magnetLink: `magnet:?xt=urn:btih:${stream.infoHash}&tr=udp://tracker.opentrackr.org:1337/announce`,
          }))
          .sort((a: TorrentInfo, b: TorrentInfo) => b.seeds - a.seeds);
      } catch (error) {
        console.error(
          `Error fetching torrent: S${seasonNumber}E${episodeNumber}`,
          error
        );
        return null;
      }
    },
    []
  );

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

        const episodes = episodesResponse.data.episodes;
        setEpisodeCache((prev) => ({
          ...prev,
          [seasonNumber]: episodes,
        }));

        if (seasonNumber === selectedSeason) {
          setEpisodes(episodes);

          // Fetch torrents for each episode
          const newTorrents: { [key: string]: TorrentInfo[] } = {};
          for (const episode of episodes) {
            setLoadingTorrents(prev => [...prev, episode.episode_number]);
            await delay(300);
            const torrentData = await fetchTorrents(
              content.imdb_id,
              seasonNumber,
              episode.episode_number
            );
            if (torrentData?.length) {
              newTorrents[episode.episode_number] = torrentData;
            }
            setLoadingTorrents(prev => prev.filter(id => id !== episode.episode_number));
          }
          setTorrents(newTorrents);
        }
      } catch (error) {
        console.error(
          `Error fetching episodes for season ${seasonNumber}:`,
          error
        );
      } finally {
        setLoadingSeasons((prev) => prev.filter((s) => s !== seasonNumber));
      }
    },
    [content?.id, content?.imdb_id, selectedSeason, episodeCache, fetchTorrents]
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

  if (isLoading) {
    <LoadingIndicator />;
  }

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
              <span className="text-sm font-medium text-white">{selectedSeason || '1'}</span>
            </div>
            <FaChevronDown className={`w-4 h-4 text-red-500 transition-transform duration-200
              ${isSeasonDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
          
          {isSeasonDropdownOpen && (
            <div className="absolute z-50 w-full mt-2 py-2 
                           bg-[#1a1a1a]/95 border border-gray-800/50 rounded-xl 
                           backdrop-blur-sm shadow-xl max-h-[60vh] overflow-y-auto">
              {seasons.map((season) => (
                <button
                  key={season.season_number}
                  onClick={() => {
                    setSelectedSeason(season.season_number);
                    setIsSeasonDropdownOpen(false);
                  }}
                  disabled={loadingSeasons.includes(season.season_number)}
                  className={`w-full flex items-center justify-between px-4 py-3
                    ${selectedSeason === season.season_number 
                      ? 'bg-red-500/20 text-red-500' 
                      : 'text-gray-300 hover:bg-gray-800/50'
                    }`}
                >
                  <span className="text-sm font-medium">Season {season.season_number}</span>
                  {loadingSeasons.includes(season.season_number) && (
                    <FaSpinner className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Season List */}
        <div className="hidden md:block overflow-x-auto">
          <div className="flex flex-nowrap gap-2 pb-2">
            {seasons.map((season) => (
              <button
                key={season.season_number}
                onClick={() => setSelectedSeason(season.season_number)}
                disabled={loadingSeasons.includes(season.season_number)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl 
                           text-sm font-medium transition-all duration-300 relative
                  ${selectedSeason === season.season_number
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                    : "bg-red-500/10 hover:bg-red-500 border-2 border-red-500/30 text-red-500 hover:text-white"
                  } ${loadingSeasons.includes(season.season_number) ? "opacity-50" : ""}`}
              >
                <span>Season {season.season_number}</span>
                {loadingSeasons.includes(season.season_number) && (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                )}
              </button>
            ))}
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
