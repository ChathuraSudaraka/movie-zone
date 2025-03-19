export interface WatchHistoryItem {
  id: string;
  title: string;
  posterPath: string | null;
  mediaType: 'movie' | 'tv';
  watchedAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'watch' | 'like' | 'add_to_list' | string;
  title: string;
  media_id?: string;
  media_type?: string;
  timestamp: string;
  user_id: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newReleaseAlerts: boolean;
  watchlistUpdates: boolean;
  recommendationEmails: boolean;
  language: string;
  autoplayTrailers: boolean;
  defaultPlaybackQuality: string;
}
