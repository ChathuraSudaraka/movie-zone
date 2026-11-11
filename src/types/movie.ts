export interface Genre {
  id: number;
  name: string;
}

export interface TMDBEpisode {
  id: number;
  air_date: string;
  episode_number: number;
  name: string;
  overview: string;
  production_code: string;
  runtime?: number;
  season_number: number;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
}

export interface TMDBSeason {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
  episodes?: TMDBEpisode[];
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Movie {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  name?: string;
  runtime?: number;
  media_type?: string;
  original_language: string;
  original_title?: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video?: boolean;
  vote_average: number;
  vote_count: number;
  first_air_date?: string;
  imdb_id?: string;
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  production_companies?: ProductionCompany[];
  genres?: { id: number; name: string }[];
  status?: string;
  tagline?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TMDBSeason[];
}
