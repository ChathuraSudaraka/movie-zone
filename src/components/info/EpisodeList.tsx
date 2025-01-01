import { useEffect } from 'react';
import EpisodeItem from './EpisodeItem';
import Pagination from '../common/Pagination';
import { TMDBEpisode } from '@/types/movie';
import { TorrentInfo } from '@/types/torrent';
import { FaInfoCircle } from 'react-icons/fa';

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
  loadingTorrents = []
}: EpisodeListProps) => {
  // Reset pagination when season changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSeason, setCurrentPage]);

  const qualities = ['2160p', '1080p', '720p', '480p', 'All'];
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEpisodes = episodes.slice(startIndex, endIndex);

  const filterTorrents = (episodeTorrents: TorrentInfo[]) => {
    if (!episodeTorrents) return [];
    
    if (selectedQuality === 'All') {
      // Group by quality and take top 2 from each
      const qualityGroups: { [key: string]: TorrentInfo[] } = {};
      episodeTorrents.forEach(torrent => {
        if (!qualityGroups[torrent.quality]) {
          qualityGroups[torrent.quality] = [];
        }
        if (qualityGroups[torrent.quality].length < 1) {
          qualityGroups[torrent.quality].push(torrent);
        }
      });
      return Object.values(qualityGroups).flat();
    }
    
    // Filter by selected quality and take top 3
    return episodeTorrents
      .filter(t => t.quality === selectedQuality)
      .slice(0, 3);
  };

  return (
    <div className="space-y-6">
      {/* Quality Filter - Mobile Optimized */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="flex flex-nowrap sm:flex-wrap gap-2 p-4 sm:p-1 min-w-min">
          {qualities.map((quality) => (
            <button
              key={quality}
              onClick={() => setSelectedQuality(quality)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium 
                         whitespace-nowrap transition-all duration-200 
                ${selectedQuality === quality
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30'
                }`}
            >
              {quality}
            </button>
          ))}
        </div>
      </div>

      {/* Episodes Grid */}
      {!Array.isArray(episodes) || episodes.length === 0 ? (
        <div className="flex items-center justify-center gap-3 p-6 
                        bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <FaInfoCircle className="w-5 h-5 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-500">
              No Episodes Available
            </p>
            <p className="text-sm text-amber-500/80">
              {selectedQuality === 'All'
                ? "No episodes found for this season."
                : `No episodes available with ${selectedQuality} quality. Try selecting a different quality option.`
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1">
          {currentEpisodes.map((episode) => (
            <EpisodeItem
              key={episode.id}
              episode={episode}
              onWatch={() => onWatch(episode)}
              torrents={filterTorrents(torrents[`${episode.episode_number}`] || [])}
              selectedQuality={selectedQuality}
              imdbId={imdbId}
              tmdbId={tmdbId}
              isLoadingTorrents={loadingTorrents.includes(episode.episode_number)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {episodes.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalItems={episodes.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default EpisodeList;
