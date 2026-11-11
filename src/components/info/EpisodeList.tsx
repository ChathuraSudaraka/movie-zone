import { useEffect, useRef } from "react";
import { SlidersHorizontal, Info } from "lucide-react";
import EpisodeItem from "./EpisodeItem";
import Pagination from "../common/Pagination";
import { LiquidSegmentedControl } from "../common/LiquidGlassControls";
import { TMDBEpisode } from "@/types/movie";
import { TorrentInfo } from "@/types/torrent";

interface EpisodeListProps {
  episodes: TMDBEpisode[];
  selectedSeason: number;
  onWatch: (episode: TMDBEpisode) => void;
  torrents: { [key: string]: TorrentInfo[] };
  selectedQuality: string;
  setSelectedQuality: (quality: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  imdbId?: string;
  tmdbId?: string;
  loadingTorrents?: number[];
}

const QUALITY_OPTIONS = [
  { value: "All", label: "All Qualities" },
  { value: "2160p", label: "4K" },
  { value: "1080p", label: "1080p" },
  { value: "720p", label: "720p" },
  { value: "480p", label: "480p" },
];

const EpisodeList = ({
  episodes,
  selectedSeason,
  onWatch,
  torrents,
  selectedQuality,
  setSelectedQuality,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  imdbId,
  tmdbId,
  loadingTorrents = [],
}: EpisodeListProps) => {
  const prevSeasonRef = useRef(selectedSeason);
  useEffect(() => {
    if (prevSeasonRef.current !== selectedSeason) {
      prevSeasonRef.current = selectedSeason;
      setCurrentPage(1);
    }
  }, [selectedSeason, setCurrentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEpisodes = episodes.slice(startIndex, endIndex);

  const filterTorrents = (episodeTorrents: TorrentInfo[]) => {
    if (!episodeTorrents) return [];

    if (selectedQuality === "All") {
      const qualityGroups: { [key: string]: TorrentInfo[] } = {};
      episodeTorrents.forEach((torrent) => {
        if (!qualityGroups[torrent.quality]) {
          qualityGroups[torrent.quality] = [];
        }
        if (qualityGroups[torrent.quality].length < 1) {
          qualityGroups[torrent.quality].push(torrent);
        }
      });
      return Object.values(qualityGroups).flat();
    }

    return episodeTorrents
      .filter((t) => t.quality === selectedQuality)
      .slice(0, 3);
  };

  return (
    <div className="space-y-4">
      {/* Frosted Quality Bar + Count */}
      <div className="glass-chip flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-[20px]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs sm:text-sm font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-300" />
            <span>Quality</span>
          </div>
          <LiquidSegmentedControl<string>
            layoutId="tv-episode-quality-lens"
            value={selectedQuality}
            onChange={setSelectedQuality}
            options={QUALITY_OPTIONS}
          />
        </div>

        <span className="text-xs text-neutral-400">
          Season {selectedSeason} • {episodes.length}{" "}
          {episodes.length === 1 ? "episode" : "episodes"}
        </span>
      </div>

      {/* Episodes List */}
      {!Array.isArray(episodes) || episodes.length === 0 ? (
        <div className="glass-chip flex items-center gap-3.5 p-6 rounded-[20px]">
          <Info className="w-5 h-5 text-amber-300 shrink-0" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-white">
              No Episodes Available
            </p>
            <p className="text-xs sm:text-sm text-neutral-400">
              {selectedQuality === "All"
                ? "No episodes found for this season."
                : `No episodes matched ${selectedQuality}. Try selecting All Qualities.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {currentEpisodes.map((episode) => (
            <EpisodeItem
              key={episode.id}
              episode={episode}
              onWatch={() => onWatch(episode)}
              torrents={filterTorrents(
                torrents[`${episode.episode_number}`] || []
              )}
              selectedQuality={selectedQuality}
              imdbId={imdbId}
              tmdbId={tmdbId}
              isLoadingTorrents={loadingTorrents.includes(
                episode.episode_number
              )}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {episodes.length > itemsPerPage && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalItems={episodes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default EpisodeList;
