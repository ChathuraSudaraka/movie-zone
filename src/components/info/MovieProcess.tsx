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
  imdb_code: string;
  year: number;
  torrents?: TorrentInfo[];
}

/**
 * These are Vite proxy routes defined in vite.config.ts.
 * Every call goes through Node.js → no CORS, no browser blocking.
 * Direct browser fetch to any YTS domain will always fail (no CORS headers).
 */
const YTS_PROXY_ROUTES = [
  "/api/yts",   // yts.ag
  "/api/yts2",  // yts.lt
  "/api/yts3",  // yts.rs
  "/api/yts4",  // yts.am
  "/api/yts5",  // yts1.mx
  "/api/yts6",  // yts-official.app
  "/api/yts7",  // yts.ninjaproxy1.com
  "/api/yts8",  // yts.proxyninja.org
];

/** Fetch a proxy route; returns parsed JSON or null on any failure */
async function proxyFetch(proxyBase: string, apiPath: string): Promise<unknown> {
  try {
    const res = await fetch(`${proxyBase}${apiPath}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text?.trim()) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Try every proxy route in order until one returns valid data.
 * Returns { data, route } on first success, null if all fail.
 */
async function ytsGet(
  apiPath: string
): Promise<{ data: unknown; route: string } | null> {
  for (const route of YTS_PROXY_ROUTES) {
    const data = await proxyFetch(route, apiPath);
    if (data !== null) {
      console.log(`[YTS] ✓ ${route} succeeded`);
      return { data, route };
    }
    console.log(`[YTS] ✗ ${route} failed`);
  }
  return null;
}

export const MovieProcess = ({
  content,
  currentPage,
  setCurrentPage,
}: MovieProcessProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [unreachable, setUnreachable] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [ytsMovie, setYtsMovie] = useState<MovieDetails | null>(null);
  const [torrents, setTorrents] = useState<TorrentInfo[]>([]);

  const handleTorrentDownload = async (torrent: TorrentInfo) => {
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
  };

  const handleMagnetDownload = (torrent: TorrentInfo) => {
    if (!torrent.hash) return;
    const trackers = [
      "udp://open.demonii.com:1337/announce",
      "udp://tracker.openbittorrent.com:80",
      "udp://tracker.coppersurfer.tk:6969",
      "udp://tracker.opentrackr.org:1337/announce",
      "udp://glotorrents.pw:6969/announce",
      "udp://p4p.arenabg.com:1337",
      "udp://tracker.leechers-paradise.org:6969",
    ];
    const magnet = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(
      ytsMovie?.title_long || ""
    )}&${trackers.map((t) => `tr=${encodeURIComponent(t)}`).join("&")}`;
    window.open(magnet, "_blank");
  };

  useEffect(() => {
    const run = async () => {
      if (!content?.title) return;

      setIsLoading(true);
      setUnreachable(false);
      setNotFound(false);
      setTorrents([]);
      setYtsMovie(null);

      const releaseYear = content.release_date?.split("-")[0] || "";
      const q1 = encodeURIComponent(content.imdb_id || content.title);
      const q2 = encodeURIComponent(content.title);

      type ListResp = { data?: { movies?: YtsMovie[] } };

      // ── Pass 1: search by imdb_id (or title if no imdb_id) ────────────────
      let result = await ytsGet(`/list_movies.json?query_term=${q1}`);
      let movies = (result?.data as ListResp)?.data?.movies;

      // ── Pass 2: no results → retry with title ─────────────────────────────
      if ((!movies?.length) && content.imdb_id && content.title) {
        result = await ytsGet(`/list_movies.json?query_term=${q2}`);
        movies = (result?.data as ListResp)?.data?.movies;
      }

      // ── All proxies failed ─────────────────────────────────────────────────
      if (!result) {
        setUnreachable(true);
        setIsLoading(false);
        return;
      }

      if (!movies?.length) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      // ── Best match: IMDB code → exact title+year → first result ───────────
      const matched =
        movies.find((m) => m.imdb_code === content.imdb_id) ??
        movies.find((m) => isExactMatch(m.title, content.title!, releaseYear)) ??
        movies[0];

      setYtsMovie(matched as unknown as MovieDetails);

      // ── Fetch full details (prefer same working proxy route) ───────────────
      const detailsResult = await ytsGet(
        `/movie_details.json?movie_id=${matched.id}&with_images=true&with_cast=true`
      );

      type DetailsResp = {
        status?: string;
        data?: {
          movie?: {
            torrents?: TorrentInfo[];
            title?: string;
            year?: number;
            download_count?: number;
            language?: string;
            description_full?: string;
            rating?: number;
            runtime?: number;
            genres?: string[];
            imdb_code?: string;
            yt_trailer_code?: string;
            cast?: unknown[];
          };
        };
      };

      const details = detailsResult?.data as DetailsResp | null;
      const md = details?.data?.movie;

      if (details?.status === "ok" && md?.torrents?.length) {
        const processed = md.torrents.map((t: TorrentInfo) => ({
          ...t,
          title: `${md.title} ${md.year ? `(${md.year})` : ""} - ${t.quality} ${t.type}`,
          source: "YTS",
          trustScore: calculateTrustScore(t),
          download_count: md.download_count ?? (t.seeds + t.peers),
          uploader: "YTS.MX",
          language: md.language || "English",
          description: md.description_full,
          rating: md.rating,
          runtime: md.runtime,
          genres: md.genres,
          is_main_movie: true,
          imdb_code: md.imdb_code,
          yt_trailer_code: md.yt_trailer_code,
          cast: md.cast,
          download_url: t.url,
          quality_details: `${t.quality} ${t.type}`,
          resolution: t.quality,
          encoding: t.type,
          hash: t.hash,
        }));
        setTorrents(sortTorrents(processed));
      } else {
        setNotFound(true);
      }

      setIsLoading(false);
    };

    run();
  }, [content?.title, content?.release_date, content?.imdb_id, retryCount]);

  if (isLoading) return <LoadingIndicator />;

  if (unreachable) {
    return (
      <div className="flex flex-col items-center gap-5 p-8 rounded-xl bg-zinc-900/60 border border-zinc-700/50 text-center">
        <AlertTriangle className="w-10 h-10 text-yellow-500" />
        <div>
          <p className="text-white font-semibold text-lg">Download Service Unavailable</p>
          <p className="text-zinc-400 text-sm mt-1 max-w-sm">
            All YTS mirror servers are currently unreachable. This may be a
            temporary outage. Try again shortly or search manually.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700
                       border border-zinc-600 text-zinc-300 rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          {content?.title && (
            <a
              href={`https://yts.ag/browse-movies/${encodeURIComponent(content.title)}/all/all/0/latest/0/all`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20
                         border border-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-sm"
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
      <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-zinc-900/60 border border-zinc-700/50 text-center">
        <Download className="w-10 h-10 text-zinc-500" />
        <div>
          <p className="text-white font-semibold text-lg">Not Available on YTS</p>
          <p className="text-zinc-400 text-sm mt-1">
            This title isn't indexed on YTS yet.
          </p>
        </div>
        {content?.title && (
          <a
            href={`https://yts.ag/browse-movies/${encodeURIComponent(content.title)}/all/all/0/latest/0/all`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700
                       border border-zinc-600 text-zinc-300 rounded-lg transition-colors text-sm"
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
};
