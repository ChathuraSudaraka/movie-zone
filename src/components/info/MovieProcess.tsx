import { useEffect, useState } from "react";
import { MovieDetails, TorrentInfo } from "../../types/torrent";
import { TorrentList } from "../common/TorrentList";
import {
  calculateTrustScore,
  sortTorrents,
  isExactMatch,
} from "../../utils/torrentUtils";
import { Movie } from "@/types/movie";
import LoadingIndicator from "./LoadingIndicator";
import ErrorMessage from "./ErrorMessage";

interface MovieProcessProps {
  content: Movie | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
}

export const MovieProcess = ({
  content,
  currentPage,
  setCurrentPage,
}: MovieProcessProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ytsMovie, setYtsMovie] = useState<MovieDetails | null>(null);
  const [torrents, setTorrents] = useState<TorrentInfo[]>([]);

  const handleTorrentDownload = async (torrent: TorrentInfo) => {
    if (!torrent.download_url) {
      console.error("Invalid torrent URL");
      return;
    }

    try {
      // Fetch the torrent file
      const response = await fetch(torrent.download_url);
      const blob = await response.blob();

      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${ytsMovie?.title_long || "movie"}-${
        torrent.quality
      }.torrent`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading torrent file:", error);
    }
  };

  const handleMagnetDownload = (torrent: TorrentInfo) => {
    if (!torrent.hash) {
      console.error("Invalid torrent hash");
      return;
    }

    const trackers = [
      "udp://open.demonii.com:1337/announce",
      "udp://tracker.openbittorrent.com:80",
      "udp://tracker.coppersurfer.tk:6969",
      "udp://glotorrents.pw:6969/announce",
      "udp://tracker.opentrackr.org:1337/announce",
      "udp://torrent.gresille.org:80/announce",
      "udp://p4p.arenabg.com:1337",
      "udp://tracker.leechers-paradise.org:6969",
    ];

    const magnetLink = `magnet:?xt=urn:btih:${
      torrent.hash
    }&dn=${encodeURIComponent(ytsMovie?.title_long || "")}&${trackers
      .map((t) => `tr=${encodeURIComponent(t)}`)
      .join("&")}`;

    window.open(magnetLink, "_blank");
  };

  useEffect(() => {
    const fetchYTSMovie = async () => {
      if (!content?.title) return;

      setIsLoading(true);
      setError(null);

      try {
        const releaseYear = content.release_date?.split("-")[0] || "";
        const response = await fetch(
          `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(
            content.imdb_id || content.title
          )}`
        );
        const data = await response.json();

        if (data.data.movies?.length > 0) {
          // First try to match by IMDB ID
          let matchedMovie = data.data.movies.find(
            (m: any) => m.imdb_code === content.imdb_id
          );

          // If no IMDB match, try exact title and year match
          if (!matchedMovie && content.title) {
            matchedMovie = data.data.movies.find((m: any) =>
              isExactMatch(m.title, content.title!, releaseYear)
            );
          }

          if (matchedMovie) {
            setYtsMovie(matchedMovie);
            const allTorrents: TorrentInfo[] = [];

            try {
              const detailsUrl = `https://yts.mx/api/v2/movie_details.json?movie_id=${matchedMovie.id}&with_images=true&with_cast=true`;
              const detailsResponse = await fetch(detailsUrl);
              const detailsData = await detailsResponse.json();

              if (detailsData.status === "ok" && detailsData.data.movie) {
                const movieDetails = detailsData.data.movie;

                if (movieDetails.torrents) {
                  const processedTorrents = movieDetails.torrents.map(
                    (torrent: any) => ({
                      ...torrent,
                      title: `${movieDetails.title} ${
                        movieDetails.year ? `(${movieDetails.year})` : ""
                      } - ${torrent.quality} ${torrent.type}`,
                      source: "YTS",
                      trustScore: calculateTrustScore(torrent),
                      date_uploaded: torrent.date_uploaded,
                      size: torrent.size,
                      download_count:
                        movieDetails.download_count ||
                        torrent.seeds + torrent.peers,
                      uploader: "YTS.MX",
                      language: movieDetails.language || "English",
                      description: movieDetails.description_full,
                      rating: movieDetails.rating,
                      runtime: movieDetails.runtime,
                      genres: movieDetails.genres,
                      is_main_movie: true,
                      imdb_code: movieDetails.imdb_code,
                      yt_trailer_code: movieDetails.yt_trailer_code,
                      cast: movieDetails.cast,
                      download_url: torrent.url,
                      quality_details: `${torrent.quality} ${torrent.type}`,
                      resolution: torrent.quality,
                      encoding: torrent.type,
                      hash: torrent.hash,
                    })
                  );

                  allTorrents.push(...processedTorrents);
                }
              }
            } catch (err) {
              console.error(
                `Error fetching details for movie ${matchedMovie.id}:`,
                err
              );
            }

            setTorrents(sortTorrents(allTorrents));
          } else {
            setError("No exact match found for this movie");
          }
        } else {
          setError("Movie not found");
        }
      } catch (err) {
        console.error("Error fetching YTS movies:", err);
        setError("Failed to fetch download options");
      } finally {
        setIsLoading(false);
      }
    };

    fetchYTSMovie();
  }, [content?.title, content?.release_date, content?.imdb_id]);

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <TorrentList
      torrents={torrents}
      currentPage={currentPage}
      itemsPerPage={5}
      onPageChange={setCurrentPage}
      onDownload={handleTorrentDownload}
      onMagnetDownload={handleMagnetDownload}
    />
  );
};
