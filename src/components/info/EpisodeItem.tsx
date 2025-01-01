import React, { useState } from 'react';
import { FaPlay, FaCalendar, FaStar, FaInfoCircle, FaMagnet, FaSpinner, FaSeedling } from 'react-icons/fa';
import { TMDBEpisode } from '@/types/movie';
import { TorrentInfo } from '@/types/torrent';
import { useVideoModal } from '@/context/VideoModalContext';

interface EpisodeItemProps {
  episode: TMDBEpisode;
  onWatch: () => void;
  torrents?: TorrentInfo[];
  selectedQuality: string;
  imdbId?: string;
  tmdbId?: string;
  isLoadingTorrents?: boolean;
}

const EpisodeItem: React.FC<EpisodeItemProps> = ({
  episode,
  torrents = [],
  imdbId,
  tmdbId,
  isLoadingTorrents = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { openModal } = useVideoModal();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = (magnetLink: string) => {
    window.open(magnetLink);
  };

  const getVideoEmbedUrl = () => {
    if (imdbId) {
      return `https://vidsrc.xyz/embed/tv/${imdbId}/${episode.season_number}-${episode.episode_number}`;
    } else if (tmdbId) {
      return `https://vidsrc.xyz/embed/tv/${tmdbId}/${episode.season_number}-${episode.episode_number}`;
    }
    return '';
  };

  const handlePlayClick = () => {
    const embedUrl = getVideoEmbedUrl();
    if (embedUrl) {
      openModal(embedUrl);
    }
  };
  
  return (
    <div className="group relative flex flex-col p-4 
                    bg-[#1a1a1a]/90 border border-gray-800/50 
                    rounded-xl transition-all duration-200">
      {/* Episode Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl 
                         bg-red-500/10 border border-red-500/30 text-white">
            <span className="text-lg font-medium">{episode.episode_number}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-medium text-white line-clamp-1">{episode.name}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
              <div className="flex items-center gap-2 text-emerald-500">
                <FaStar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-sm font-medium">{episode.vote_average.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-500">
                <FaCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-sm">{formatDate(episode.air_date)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <button
            onClick={handlePlayClick}
            className="flex items-center gap-2 px-4 py-2 
                     bg-red-500/10 hover:bg-red-500 border border-red-500/30 
                     rounded-xl transition-all duration-200"
          >
            <FaPlay className="w-4 h-4" />
            <span className="text-sm font-medium">Watch</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 
                     bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 
                     rounded-xl transition-all duration-200"
          >
            <FaInfoCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Details</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-800/50">
          {/* Overview Section */}
          {episode.overview ? (
            <p className="text-sm text-gray-300 mb-4">{episode.overview}</p>
          ) : (
            <div className="flex items-center gap-3 p-4 mb-4
                            bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <FaInfoCircle className="w-5 h-5 text-amber-500" />
              <p className="text-sm text-amber-500">No overview available for this episode.</p>
            </div>
          )}

          {/* Download Options Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Download Options</h4>
            {isLoadingTorrents ? (
              <div className="flex items-center justify-center gap-3 p-6 
                              bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <FaSpinner className="w-5 h-5 text-blue-500 animate-spin" />
                <p className="text-sm font-medium text-blue-500">
                  Searching for available download sources...
                </p>
              </div>
            ) : !Array.isArray(torrents) || torrents.length === 0 ? (
              <div className="flex items-center gap-3 p-6 
                              bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <FaInfoCircle className="w-5 h-5 text-amber-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-500">
                    No Download Sources Available
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                {torrents.map((torrent, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 
                             bg-[#1a1a1a]/90 hover:bg-[#232323]/90 
                             border border-gray-800/50 rounded-xl"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1.5 text-sm font-medium border 
                                   bg-emerald-500/10 border-emerald-500/30 rounded-md">
                        {torrent.quality}
                      </span>
                      <span className="text-sm text-gray-300">{torrent.size}</span>
                      <div className="flex items-center gap-2 text-emerald-500">
                        <FaSeedling className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium">{torrent.seeds}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(torrent.magnetLink)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 
                               bg-blue-500/10 hover:bg-blue-500 border border-blue-500/30 
                               rounded-xl transition-all duration-200"
                    >
                      <FaMagnet className="w-4 h-4" />
                      <span className="text-sm font-medium">Magnet</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EpisodeItem;
