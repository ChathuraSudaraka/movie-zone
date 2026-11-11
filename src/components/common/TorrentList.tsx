import React, { useMemo, useState } from "react";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { TorrentItem } from "./TorrentItem";
import { Quality, TorrentInfo } from "../../types/torrent";
import Pagination from "./Pagination";
import { LiquidSegmentedControl } from "./LiquidGlassControls";

type QualityType = "4K" | "1080p" | "720p" | "480p" | "all";

interface TorrentListProps {
  torrents: TorrentInfo[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onDownload: (torrent: TorrentInfo) => void;
  onMagnetDownload: (torrent: TorrentInfo) => void;
}

const normalizeQuality = (quality: string): string => {
  const q = quality.toLowerCase();
  if (q.includes("2160") || q.includes("4k")) return "4K";
  if (q.includes("1080")) return "1080p";
  if (q.includes("720")) return "720p";
  if (q.includes("480")) return "480p";
  return quality;
};

const QUALITY_ORDER: Record<string, number> = {
  "4K": 5,
  "2160p": 5,
  "1080p": 4,
  "720p": 3,
  "480p": 2,
  all: 1,
};

export const TorrentList: React.FC<TorrentListProps> = ({
  torrents,
  currentPage,
  itemsPerPage,
  onPageChange,
  onDownload,
  onMagnetDownload,
}) => {
  const [sortBy, setSortBy] = useState<"seeds" | "quality">("seeds");
  const [qualityFilter, setQualityFilter] = useState<Quality>("all");

  const qualities: Quality[] = ["all", "4K", "1080p", "720p", "480p"];

  const qualityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: torrents.length };
    for (const t of torrents) {
      const nq = normalizeQuality(t.quality);
      counts[nq] = (counts[nq] || 0) + 1;
    }
    return counts;
  }, [torrents]);

  const sortedTorrents = useMemo(() => {
    return [...torrents].sort((a, b) => {
      if (sortBy === "seeds") {
        return (Number(b.seeds) || 0) - (Number(a.seeds) || 0);
      }
      const qA = normalizeQuality(a.quality);
      const qB = normalizeQuality(b.quality);
      return (QUALITY_ORDER[qB] || 0) - (QUALITY_ORDER[qA] || 0);
    });
  }, [torrents, sortBy]);

  const filteredTorrents = useMemo(() => {
    if (qualityFilter === "all") return sortedTorrents;
    return sortedTorrents.filter(
      (t) => normalizeQuality(t.quality) === normalizeQuality(qualityFilter)
    );
  }, [sortedTorrents, qualityFilter]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTorrents = filteredTorrents.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handleFilterChange = (quality: string) => {
    setQualityFilter(quality as QualityType);
    onPageChange(1);
  };

  const handleSortChange = (sort: "seeds" | "quality") => {
    setSortBy(sort);
    onPageChange(1);
  };

  return (
    <div className="w-full space-y-4">
      {/* Frosted Controls Bar */}
      <div className="glass-chip flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-[22px]">
        {/* Quality Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs sm:text-sm font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-300" />
            <span>Quality</span>
          </div>
          <LiquidSegmentedControl<Quality>
            layoutId="torrent-quality-lens"
            value={qualityFilter}
            onChange={(q) => handleFilterChange(q)}
            options={qualities.map((quality) => {
              const count = qualityCounts[quality] || 0;
              return {
                value: quality,
                label: quality === "all" ? "All" : quality,
                count,
                disabled: quality !== "all" && count === 0,
              };
            })}
          />
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs sm:text-sm font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-300" />
            <span>Sort</span>
          </div>
          <LiquidSegmentedControl<"seeds" | "quality">
            layoutId="torrent-sort-lens"
            value={sortBy}
            onChange={handleSortChange}
            options={[
              { value: "seeds", label: "Fastest" },
              { value: "quality", label: "Quality" },
            ]}
          />
        </div>
      </div>

      {/* Release Summary */}
      <div className="flex items-center justify-between px-1 text-xs text-neutral-400">
        <span>
          {filteredTorrents.length}{" "}
          {filteredTorrents.length === 1 ? "release" : "releases"} available
        </span>
        <span className="hidden sm:inline">
          Recommended options have strong active seed counts
        </span>
      </div>

      {/* Torrent Rows */}
      <div className="space-y-2.5">
        {currentTorrents.length > 0 ? (
          currentTorrents.map((torrent, index) => (
            <TorrentItem
              key={`${torrent.infoHash}-${index}`}
              torrent={torrent}
              onDownload={onDownload}
              onMagnetDownload={onMagnetDownload}
              isRecommended={
                currentPage === 1 &&
                index === 0 &&
                sortBy === "seeds" &&
                (Number(torrent.seeds) || 0) >= 20
              }
            />
          ))
        ) : (
          <div className="glass-chip flex flex-col items-center justify-center p-8 text-center rounded-[22px]">
            <p className="text-sm font-medium text-neutral-200">
              No releases found for {qualityFilter}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Try selecting “All” to see every available quality.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredTorrents.length > itemsPerPage && (
        <div className="pt-2">
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
