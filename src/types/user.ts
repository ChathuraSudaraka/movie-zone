export interface WatchHistoryItem {
  id: string;
  title: string;
  posterPath: string;
  mediaType: 'movie' | 'tv';
  watchedAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'watch' | 'like' | 'add_to_list';
  title: string;
  mediaType: 'movie' | 'tv';
  timestamp: string;
  posterPath: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newReleaseAlerts: boolean;
  watchlistUpdates: boolean;
  recommendationEmails: boolean;
  language: string;
  autoplayTrailers: boolean;
  defaultPlaybackQuality: 'auto' | '720p' | '1080p' | '4k';
}
