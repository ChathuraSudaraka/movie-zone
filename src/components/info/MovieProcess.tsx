import React, { useEffect, useState, useCallback } from "react";
import { MovieDetails, TorrentInfo } from "../../types/torrent";
import { TorrentList } from "../common/TorrentList";
import {
  calculateTrustScore,
  sortTorrents,
  isExactMatch,
} from "../../utils/torrentUtils";
import { Movie } from "@/types/movie";
import LoadingIndicator from "./LoadingIndicator";
import { Download, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";

interface MovieProcessProps {
  content: Movie | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
}

interface YtsMovie {
  id: number;
  title: string;
  title_long?: string;
  imdb_code: string;
  year: number;
  rating?: number;
  runtime?: number;
  genres?: string[];
  language?: string;
  description_full?: string;
  yt_trailer_code?: string;
  torrents?: (TorrentInfo & { url?: string })[];
}

const YTS_PROXY_ROUTES = [
  "/api/yts",
  "/api/yts2",
  "/api/yts3",
  "/api/yts4",
  "/api/yts5",
  "/api/yts6",
  "/api/yts7",
  "/api/yts8",
];

let preferredYtsRoute: string | null = null;

interface CachedYtsEntry {
  status: "ok" | "not_found";
  ytsMovie: MovieDetails | null;
  torrents: TorrentInfo[];
}

const YTS_CACHE_MAX = 50;

const ytsMovieCache = new Map<string, CachedYtsEntry>();

function setYtsMovieCache(key: string, value: CachedYtsEntry) {
  if (ytsMovieCache.has(key)) {
    ytsMovieCache.delete(key);
  } else if (ytsMovieCache.size >= YTS_CACHE_MAX) {
    const oldestKey = ytsMovieCache.keys().next().value;
    if (oldestKey !== undefined) {
      ytsMovieCache.delete(oldestKey);
    }
  }
  ytsMovieCache.set(key, value);
}

const MAGNET_TRACKERS = [
  "udp://open.demonii.com:1337/announce",
  "udp://tracker.openbittorrent.com:80",
  "udp://tracker.coppersurfer.tk:6969",
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://glotorrents.pw:6969/announce",
  "udp://p4p.arenabg.com:1337",
  "udp://tracker.leechers-paradise.org:6969",
];

const ENCODED_TRACKERS = MAGNET_TRACKERS.map(
  (t) => `&tr=${encodeURIComponent(t)}`
).join("");

async function proxyFetch(
  proxyBase: string,
  apiPath: string,
  timeoutMs = 4500
): Promise<unknown> {
  const res = await fetch(`${proxyBase}${apiPath}`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text?.trim()) throw new Error("Empty response");
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON");
  return parsed;
}

function raceFirstSuccess<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let failed = 0;
    const total = promises.length;
    if (total === 0) {
      reject(new Error("Empty batch"));
      return;
    }
    promises.forEach((p) => {
      p.then(resolve).catch(() => {
        failed += 1;
        if (failed === total) reject(new Error("All failed"));
      });
    });
  });
}

/**
 * Races YTS proxy mirrors in parallel batches (instead of waiting 8x10s sequentially)
 * and remembers the fastest working mirror for subsequent calls.
 */
async function ytsGet(
  apiPath: string
): Promise<{ data: unknown; route: string } | null> {
  if (preferredYtsRoute) {
    try {
      const data = await proxyFetch(preferredYtsRoute, apiPath, 3500);
      return { data, route: preferredYtsRoute };
    } catch {
      preferredYtsRoute = null;
    }
  }

  const batches = [YTS_PROXY_ROUTES.slice(0, 4), YTS_PROXY_ROUTES.slice(4)];
  for (const batch of batches) {
    try {
      const winner = await raceFirstSuccess(
        batch.map(async (route) => {
          const data = await proxyFetch(route, apiPath, 4500);
          return { data, route };
        })
      );
      preferredYtsRoute = winner.route;
      return winner;
    } catch {
      // Try next batch
    }
  }

  return null;
}

function mapTorrents(md: YtsMovie): TorrentInfo[] {
  if (!md.torrents?.length) return [];
  return sortTorrents(
    md.torrents.map((t) => ({
      ...t,
      title: `${md.title} ${md.year ? `(${md.year})` : ""} - ${t.quality} ${t.type}`,
      source: "YTS",
      trustScore: calculateTrustScore(t),
      download_count: t.seeds + t.peers,
      uploader: "YTS.MX",
      language: md.language || "English",
      description: md.description_full || "",
      rating: md.rating,
      runtime: md.runtime,
      genres: md.genres,
      is_main_movie: true,
      imdb_code: md.imdb_code,
      yt_trailer_code: md.yt_trailer_code,
      download_url: t.url || t.download_url,
      quality_details: `${t.quality} ${t.type}`,
      resolution: t.quality,
      encoding: t.type,
      hash: t.hash,
    }))
  );
}

export const MovieProcess = React.memo(
  ({ content, currentPage, setCurrentPage }: MovieProcessProps) => {
    const cacheKey = content
      ? `${content.id}:${content.imdb_id || content.title || ""}`
      : "";
    const cached = cacheKey ? ytsMovieCache.get(cacheKey) : undefined;

    const [isLoading, setIsLoading] = useState(!cached);
    const [unreachable, setUnreachable] = useState(false);
    const [notFound, setNotFound] = useState(cached?.status === "not_found");
    const [retryCount, setRetryCount] = useState(0);
    const [ytsMovie, setYtsMovie] = useState<MovieDetails | null>(
      cached?.ytsMovie ?? null
    );
    const [torrents, setTorrents] = useState<TorrentInfo[]>(
      cached?.torrents ?? []
    );

    const handleTorrentDownload = useCallback(
      async (torrent: TorrentInfo) => {
        if (!torrent.download_url) return;
        try {
          const response = await fetch(torrent.download_url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${ytsMovie?.title_long || "movie"}-${torrent.quality}.torrent`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch (err) {
          console.error("Download failed:", err);
        }
      },
      [ytsMovie?.title_long]
    );

    const handleMagnetDownload = useCallback(
      (torrent: TorrentInfo) => {
        if (!torrent.hash) return;
        const magnet = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(
          ytsMovie?.title_long || ""
        )}${ENCODED_TRACKERS}`;
        window.open(magnet, "_blank");
      },
      [ytsMovie?.title_long]
    );

    useEffect(() => {
      if (!content?.title) return;

      if (retryCount === 0 && cacheKey && ytsMovieCache.has(cacheKey)) {
        const hit = ytsMovieCache.get(cacheKey)!;
        setYtsMovie(hit.ytsMovie);
        setTorrents(hit.torrents);
        setNotFound(hit.status === "not_found");
        setUnreachable(false);
        setIsLoading(false);
        return;
      }

      let cancelled = false;

      const run = async () => {
        setIsLoading(true);
        setUnreachable(false);
        setNotFound(false);
        setTorrents([]);
        setYtsMovie(null);

        const releaseYear = content.release_date?.split("-")[0] || "";
        const q1 = encodeURIComponent(content.imdb_id || content.title);
        const q2 = encodeURIComponent(content.title);

        type ListResp = { data?: { movies?: YtsMovie[] } };

        let result = await ytsGet(`/list_movies.json?query_term=${q1}`);
        if (cancelled) return;
        let movies = (result?.data as ListResp)?.data?.movies;

        if (!movies?.length && content.imdb_id && content.title) {
          result = await ytsGet(`/list_movies.json?query_term=${q2}`);
          if (cancelled) return;
          movies = (result?.data as ListResp)?.data?.movies;
        }

        if (!result) {
          setUnreachable(true);
          setIsLoading(false);
          return;
        }

        if (!movies?.length) {
          if (cacheKey) {
            setYtsMovieCache(cacheKey, {
              status: "not_found",
              ytsMovie: null,
              torrents: [],
            });
          }
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        const matched =
          movies.find((m) => m.imdb_code === content.imdb_id) ??
          movies.find((m) =>
            isExactMatch(m.title, content.title!, releaseYear)
          ) ??
          movies[0];

        const movieDetails = matched as unknown as MovieDetails;
        setYtsMovie(movieDetails);

        // Use torrents directly from /list_movies.json when present (saves a 2nd round-trip)
        let resolvedTorrents = mapTorrents(matched);

        if (!resolvedTorrents.length) {
          const detailsResult = await ytsGet(
            `/movie_details.json?movie_id=${matched.id}`
          );
          if (cancelled) return;
          type DetailsResp = {
            status?: string;
            data?: { movie?: YtsMovie };
          };
          const details = detailsResult?.data as DetailsResp | null;
          if (details?.status === "ok" && details.data?.movie) {
            resolvedTorrents = mapTorrents(details.data.movie);
          }
        }

        if (resolvedTorrents.length) {
          if (cacheKey) {
            setYtsMovieCache(cacheKey, {
              status: "ok",
              ytsMovie: movieDetails,
              torrents: resolvedTorrents,
            });
          }
          setTorrents(resolvedTorrents);
        } else {
          if (cacheKey) {
            setYtsMovieCache(cacheKey, {
              status: "not_found",
              ytsMovie: movieDetails,
              torrents: [],
            });
          }
          setNotFound(true);
        }

        setIsLoading(false);
      };

      run();
      return () => {
        cancelled = true;
      };
    }, [
      cacheKey,
      content?.id,
      content?.title,
      content?.release_date,
      content?.imdb_id,
      retryCount,
    ]);

    if (isLoading) return <LoadingIndicator />;

    if (unreachable) {
      return (
        <div className="glass-chip flex flex-col items-center gap-5 p-8 rounded-[20px] text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <div>
            <p className="text-white font-semibold text-lg">
              Download Service Unavailable
            </p>
            <p className="text-neutral-400 text-sm mt-1 max-w-sm">
              All YTS mirror servers are currently unreachable. This may be a
              temporary outage. Try again shortly or search manually.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="btn-glass px-4 py-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            {content?.title && (
              <a
                href={`https://yts.ag/browse-movies/${encodeURIComponent(
                  content.title
                )}/all/all/0/latest/0/all`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-4 py-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Search on YTS
              </a>
            )}
          </div>
        </div>
      );
    }

    if (notFound) {
      return (
        <div className="glass-chip flex flex-col items-center gap-4 p-8 rounded-[20px] text-center">
          <Download className="w-10 h-10 text-neutral-400" />
          <div>
            <p className="text-white font-semibold text-lg">
              Not Available on YTS
            </p>
            <p className="text-neutral-400 text-sm mt-1">
              This title isn't indexed on YTS yet.
            </p>
          </div>
          {content?.title && (
            <a
              href={`https://yts.ag/browse-movies/${encodeURIComponent(
                content.title
              )}/all/all/0/latest/0/all`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass px-4 py-2 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Search "{content.title}" on YTS
            </a>
          )}
        </div>
      );
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
  }
);
