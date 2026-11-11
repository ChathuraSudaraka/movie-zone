import { TorrentInfo } from "@/types/torrent";

export const normalizeTitle = (title: string): string => {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const isExactMatch = (torrentTitle: string, movieTitle: string, releaseYear: string): boolean => {
  const normalizedTorrentTitle = normalizeTitle(torrentTitle);
  const normalizedMovieTitle = normalizeTitle(movieTitle);
  
  // Check if year is present in torrent title
  const yearMatch = torrentTitle.includes(releaseYear);
  
  // Direct match with year
  if (normalizedTorrentTitle === `${normalizedMovieTitle} ${releaseYear}`) {
    return true;
  }
  
  // Check if torrent title contains movie title and year
  if (normalizedTorrentTitle.includes(normalizedMovieTitle) && yearMatch) {
    // Ensure the title match is a complete word
    const titleIndex = normalizedTorrentTitle.indexOf(normalizedMovieTitle);
    const nextChar = normalizedTorrentTitle[titleIndex + normalizedMovieTitle.length];
    
    // Check if the next character after the title is a space, number, or end of string
    if (!nextChar || nextChar === ' ' || /\d/.test(nextChar)) {
      return true;
    }
  }
  
  return false;
};

export const getTitleVariations = (title: string): string[] => {
  const variations = [title];
  
  // Remove common prefixes
  const withoutPrefix = title.replace(/^(the|a|an)\s+/i, '');
  if (withoutPrefix !== title) variations.push(withoutPrefix);
  
  // Only add basic variations to reduce false matches
  variations.push(title.split(':')[0].trim());
  variations.push(title.split(' - ')[0].trim());
  
  // Remove everything in parentheses
  const withoutParentheses = title.replace(/\s*\([^)]*\)/g, '').trim();
  if (withoutParentheses !== title) variations.push(withoutParentheses);
  
  return [...new Set(variations)].filter(Boolean);
};

export const calculateTrustScore = (torrent: TorrentInfo): number => {
  let score = 0;
  const maxScore = 100;

  // Quality score (25%)
  if (torrent.quality) {
    switch (torrent.quality.toLowerCase()) {
      case "2160p":
      case "4k":
        score += 25;
        break;
      case "1080p":
        score += 20;
        break;
      case "720p":
        score += 15;
        break;
      default:
        score += 10;
    }
  }

  // Source reputation (25%)
  score += 25;

  // Seeders score (25%)
  if (torrent.seeds) {
    if (torrent.seeds > 1000) score += 25;
    else if (torrent.seeds > 500) score += 20;
    else if (torrent.seeds > 100) score += 15;
    else if (torrent.seeds > 50) score += 10;
    else score += 5;
  }

  // Additional metadata (25%)
  if (torrent.size) score += 10;
  if (torrent.date_uploaded) score += 5;
  if (torrent.type) score += 5;
  if (torrent.peers && torrent.peers > 0) score += 5;

  return Math.min(score, maxScore);
};

export const sortTorrents = (torrents: TorrentInfo[]): TorrentInfo[] => {
  return [...torrents].sort((a, b) => {
    // First by main movie status
    if (a.is_main_movie && !b.is_main_movie) return -1;
    if (!a.is_main_movie && b.is_main_movie) return 1;

    // Then by quality
    const qualityOrder = {
      '2160p': 4,
      '1080p': 3,
      '720p': 2,
      '480p': 1
    };
    const qualityDiff = (qualityOrder[b.resolution as keyof typeof qualityOrder] || 0) -
                       (qualityOrder[a.resolution as keyof typeof qualityOrder] || 0);
    if (qualityDiff !== 0) return qualityDiff;

    // Then by seeds
    const seedsDiff = (b.seeds || 0) - (a.seeds || 0);
    if (seedsDiff !== 0) return seedsDiff;

    return (b.trustScore || 0) - (a.trustScore || 0);
  });
};

export const getTorrentHealth = (seeds: number) => {
  if (seeds >= 50) {
    return {
      label: "Fast",
      dotClass: "bg-emerald-400",
      textClass: "text-emerald-300",
    };
  }
  if (seeds >= 15) {
    return {
      label: "Good",
      dotClass: "bg-sky-400",
      textClass: "text-sky-300",
    };
  }
  if (seeds >= 1) {
    return {
      label: "Slow",
      dotClass: "bg-amber-400",
      textClass: "text-amber-300",
    };
  }
  return {
    label: "Inactive",
    dotClass: "bg-neutral-500",
    textClass: "text-neutral-400",
  };
};

export const formatTorrentQuality = (quality?: string) =>
  quality?.toLowerCase() === "2160p" ? "4K UHD" : quality || "Standard";
