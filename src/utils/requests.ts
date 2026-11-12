export const BASE_URL = "https://api.themoviedb.org/3";

export const baseUrl = "https://image.tmdb.org/t/p/original/";
export const thumbnailUrl = "https://image.tmdb.org/t/p/w500";

const TMDB_IMG = "https://image.tmdb.org/t/p";

/** Sized TMDB image URL (avoids multi-MB `original` downloads on mobile). */
export const tmdbImage = (
  path: string | null | undefined,
  size: "w185" | "w300" | "w342" | "w500" | "w780" | "w1280" | "original" = "w500"
) => (path ? `${TMDB_IMG}/${size}${path.startsWith("/") ? path : `/${path}`}` : "");

/** Responsive poster srcSet for grid / row cards. */
export const posterSrcSet = (path: string | null | undefined) =>
  path
    ? `${tmdbImage(path, "w342")} 342w, ${tmdbImage(path, "w500")} 500w, ${tmdbImage(path, "w780")} 780w`
    : undefined;

/** Responsive backdrop srcSet for full-bleed hero banners. */
export const backdropSrcSet = (path: string | null | undefined) =>
  path
    ? `${tmdbImage(path, "w780")} 780w, ${tmdbImage(path, "w1280")} 1280w, ${tmdbImage(path, "original")} 1920w`
    : undefined;

export const requests = {
  fetchTrending: `/trending/all/week`,
  fetchTopRatedTV: `/tv/top_rated`,
  fetchPopularTV: `/tv/popular`,
  fetchNetflixOriginals: `/discover/tv?with_networks=213`,
  fetchActionMovies: `/discover/movie?with_genres=28`,
  fetchComedyMovies: `/discover/movie?with_genres=35`,
  fetchHorrorMovies: `/discover/movie?with_genres=27`,
  fetchRomanceMovies: `/discover/movie?with_genres=10749`,
  fetchDocumentaries: `/discover/movie?with_genres=99`,
};

export default requests;
