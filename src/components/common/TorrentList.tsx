import React, { useState, useEffect } from 'react';
import { TorrentItem } from './TorrentItem';
import { Quality, TorrentInfo } from '../../types/torrent';
import { FaFilter, FaSort } from 'react-icons/fa';
import Pagination from './Pagination';

type QualityType = '4K' | '1080p' | '720p' | '480p' | 'all';

interface TorrentListProps {
  torrents: TorrentInfo[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onDownload: (torrent: TorrentInfo) => void;
  onMagnetDownload: (torrent: TorrentInfo) => void;
}

export const TorrentList: React.FC<TorrentListProps> = ({
  torrents,
  currentPage,
  itemsPerPage,
  onPageChange,
  onDownload,
  onMagnetDownload,
}) => {
  const [sortBy, setSortBy] = useState<'seeds' | 'quality'>('seeds');
  const [qualityFilter, setQualityFilter] = useState<Quality>('all');

  const qualities: Quality[] = ['4K', '1080p', '720p', '480p', 'all'];

  // Normalize quality for comparison
  const normalizeQuality = (quality: string): string => {
    quality = quality.toLowerCase();
    if (quality.includes('2160') || quality.includes('4k')) return '4K';
    if (quality.includes('1080')) return '1080p';
    if (quality.includes('720')) return '720p';
    if (quality.includes('480')) return '480p';
    return quality;
  };

  // Updated quality priority mapping
  const qualityOrder: Record<string, number> = {
    '4K': 5,
    '2160p': 5,
    '1080p': 4,
    '720p': 3,
    '480p': 2,
    'all': 1,
  };

  // Updated sorting logic
  const sortedTorrents = [...torrents].sort((a, b) => {
    if (sortBy === 'seeds') {
      const seedsA = Number(a.seeds) || 0;
      const seedsB = Number(b.seeds) || 0;
      return seedsB - seedsA;
    } else {
      const qualityA = normalizeQuality(a.quality);
      const qualityB = normalizeQuality(b.quality);
      return (qualityOrder[qualityB] || 0) - (qualityOrder[qualityA] || 0);
    }
  });

  // Updated filter logic
  const filteredTorrents = sortedTorrents.filter(torrent => {
    if (qualityFilter === 'all') return true;
    return normalizeQuality(torrent.quality) === normalizeQuality(qualityFilter);
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTorrents = filteredTorrents.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when filter/sort changes
  const handleFilterChange = (quality: string) => {
    setQualityFilter(quality as QualityType);
    onPageChange(1);
  };

  const handleSortChange = (sort: 'seeds' | 'quality') => {
    setSortBy(sort);
    onPageChange(1);
  };

  return (
    <div className="w-full space-y-4">
      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 
                    bg-[#1a1a1a]/90 backdrop-blur-lg border border-gray-800/50 rounded-xl">
        {/* Quality Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400">
            <FaFilter className="w-4 h-4 text-red-500" />
            <span className="text-sm">Quality:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {qualities.map(quality => (
              <button
                key={quality}
                onClick={() => handleFilterChange(quality)}
                className={`px-3 py-1.5 text-sm rounded-xl transition-all duration-200 border ${
                  qualityFilter === quality
                    ? 'bg-red-500/10 text-red-500 border-red-500/30'
                    : 'bg-gray-800/30 text-gray-400 border-gray-700/50 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                {quality.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400">
            <FaSort className="w-4 h-4 text-red-500" />
            <span className="text-sm">Sort by:</span>
          </div>
          <div className="flex gap-2">
            {['seeds', 'quality'].map((sortOption) => (
              <button
                key={sortOption}
                onClick={() => handleSortChange(sortOption as 'seeds' | 'quality')}
                className={`px-3 py-1.5 text-sm rounded-xl transition-all duration-200 border ${
                  sortBy === sortOption
                    ? 'bg-red-500/10 text-red-500 border-red-500/30'
                    : 'bg-gray-800/30 text-gray-400 border-gray-700/50 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Torrent List */}
      <div className="space-y-2">
        {currentTorrents.length > 0 ? (
          currentTorrents.map((torrent, index) => (
            <TorrentItem
              key={`${torrent.infoHash}-${index}`}
              torrent={torrent}
              onDownload={onDownload}
              onMagnetDownload={onMagnetDownload}
            />
          ))
        ) : (
          <div className="flex items-center justify-center p-8 text-gray-400 
                        bg-[#1a1a1a]/90 backdrop-blur-lg border border-gray-800/50 rounded-xl">
            <p>No torrents found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredTorrents.length > itemsPerPage && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredTorrents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};
