export interface WatchHistoryItem {
  id: string;
  title: string;
  posterPath: string | null;
  mediaType: 'movie' | 'tv';
  watchedAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'watch' | 'like' | 'add_to_list' | 'rate' | 'review' | 'share' | 'view' | 'finish_series' | string;
  title: string;
  media_id?: string;
  media_type?: string;
  timestamp: string;
  user_id: string;
  metadata?: {
    rating?: string;
    content?: string;
    platform?: string;
    progress?: number;
    poster_path?: string;
  };
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newReleaseAlerts: boolean;
  watchlistUpdates: boolean;
  recommendationEmails: true;
  language: string;
  autoplayTrailers: boolean;
  defaultPlaybackQuality: string;
}
