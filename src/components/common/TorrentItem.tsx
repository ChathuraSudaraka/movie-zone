import React from 'react';
import { FaSeedling, FaFileDownload, FaMagnet, FaFilm, FaHdd, FaUsers, FaShieldAlt } from "react-icons/fa";
import { TorrentInfo } from '../../types/torrent';

interface TorrentItemProps {
  torrent: TorrentInfo;
  onDownload: (torrent: TorrentInfo) => void;
  onMagnetDownload: (torrent: TorrentInfo) => void;
}

const getTrustLevelColor = (trustScore: number) => {
  if (trustScore >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
  if (trustScore >= 60) return "text-blue-500 bg-blue-500/10 border-blue-500/30";
  if (trustScore >= 40) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
  return "text-red-500 bg-red-500/10 border-red-500/30";
};

const formatSize = (size: string) => {
  return size.replace(/\s*bytes/i, 'B').replace(/\s*gigabytes/i, 'GB').replace(/\s*megabytes/i, 'MB');
};

export const TorrentItem: React.FC<TorrentItemProps> = ({ torrent, onDownload, onMagnetDownload }) => {
  const trustLevelClass = getTrustLevelColor(torrent.trustScore || 0);
  
  return (
    <div className="group relative flex flex-col p-4 
                    bg-[#1a1a1a]/90 hover:bg-[#232323]/90 border border-gray-800/50 rounded-xl 
                    transition-all duration-200">
      {/* Mobile Layout */}
      <div className="flex flex-col gap-4 w-full md:hidden">
        {/* Top Row - Quality and Size */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${trustLevelClass}`}>
            <FaShieldAlt className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">{torrent.quality}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <FaHdd className="w-4 h-4 text-emerald-500" />
            <span className="text-sm">{formatSize(torrent.size)}</span>
          </div>
        </div>

        {/* Middle Row - Seeds and Provider */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FaSeedling className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">{torrent.seeds}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaUsers className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-500">{torrent.peers}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <FaFilm className="w-4 h-4 text-blue-500" />
            <span className="text-sm">{torrent.type}</span>
          </div>
        </div>

        {/* Bottom Row - Download Buttons */}
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={() => onDownload(torrent)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
                     bg-red-500/10 hover:bg-red-500 border border-red-500/30 
                     rounded-xl transition-all duration-200"
          >
            <FaFileDownload className="w-4 h-4" />
            <span className="text-sm font-medium">Torrent</span>
          </button>
          <button
            onClick={() => onMagnetDownload(torrent)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
                     bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 
                     rounded-xl transition-all duration-200"
          >
            <FaMagnet className="w-4 h-4" />
            <span className="text-sm font-medium">Magnet</span>
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex md:items-center md:gap-4">
        {/* Left Section - Quality and Trust Score */}
        <div className="flex items-center gap-3 min-w-[140px]">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${trustLevelClass}`}>
            <FaShieldAlt className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">{torrent.quality}</span>
          </div>
        </div>

        {/* Middle Section - Info */}
        <div className="flex items-center gap-6 flex-1">
          <div className="flex items-center gap-2 text-gray-300">
            <FaFilm className="w-4 h-4 text-red-500" />
            <span className="text-sm">{torrent.type}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <FaHdd className="w-4 h-4 text-emerald-500" />
            <span className="text-sm">{formatSize(torrent.size)}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaSeedling className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">{torrent.seeds}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaUsers className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-500">{torrent.peers}</span>
            </div>
          </div>
        </div>

        {/* Right Section - Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDownload(torrent)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 
                     border border-red-500/30 rounded-xl transition-all duration-200"
          >
            <FaFileDownload className="w-4 h-4" />
            <span className="text-sm font-medium">Torrent</span>
          </button>
          <button
            onClick={() => onMagnetDownload(torrent)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 
                     border border-emerald-500/30 rounded-xl transition-all duration-200"
          >
            <FaMagnet className="w-4 h-4" />
            <span className="text-sm font-medium">Magnet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
