export type Quality = '4K' | '2160p' | '1080p' | '720p' | '480p' | 'all';

export interface TorrentInfo {
  url: string;
  hash: string;
  quality: string;
  type: string;
  seeds: number;
  peers: number;
  size: string;
  infoHash: string;
  provider: string;
  resolution: string;
  is_main_movie: boolean;
  download_url: string;
  magnetLink: string;
  trustScore: number;
  size_bytes: number;
  date_uploaded: string;
}

export interface MovieDetails {
  id: number;
  title: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  title_long: string;
  summary: string;
  description_full: string;
  language: string;
  torrents: TorrentInfo[];
  background_image: string;
  background_image_original: string;
  small_cover_image: string;
  medium_cover_image: string;
  large_cover_image: string;
}

export interface TVEpisode {
  title: string;
  episode: number;
  season: number;
  magnet_link: string;
  size: string;
  seeds: number;
  peers: number;
  quality: string;
}

export interface TVSeriesDetails {
  episodes: TVEpisode[];
  seasons: number[];
}
