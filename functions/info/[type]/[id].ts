interface Env {
  ASSETS: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  };
  TMDB_API_KEY?: string;
  VITE_TMDB_API_KEY?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
  params: {
    type?: string;
    id?: string;
  };
}

interface TmdbMetaPayload {
  title?: string;
  name?: string;
  overview?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  images?: {
    backdrops?: Array<{ file_path?: string; vote_average?: number }>;
  };
}

class MetaAttributeRewriter {
  constructor(
    private readonly attrName: string,
    private readonly valuesByAttr: Record<string, string>,
    private readonly targetAttr: string = "content"
  ) {}

  element(element: {
    getAttribute: (name: string) => string | null;
    setAttribute: (name: string, value: string) => void;
  }) {
    const key = element.getAttribute(this.attrName);
    if (key && this.valuesByAttr[key]) {
      element.setAttribute(this.targetAttr, this.valuesByAttr[key]);
    }
  }
}

class TitleTextRewriter {
  constructor(private readonly title: string) {}

  element(element: { setInnerContent: (content: string) => void }) {
    element.setInnerContent(this.title);
  }
}

function buildDescription(overview?: string, fallbackTitle?: string): string {
  const clean = (overview || "").trim();
  if (!clean) {
    return `Watch ${fallbackTitle || "this title"} on MovieZone — discover trailers, episode guides, and streaming options.`;
  }
  return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}...` : clean;
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const type = params.type === "tv" || params.type === "movie" ? params.type : null;
  const id = params.id && /^\d+$/.test(params.id) ? params.id : null;

  // Serve static SPA shell via Cloudflare ASSETS
  const assetResponse = await env.ASSETS.fetch(new URL("/index.html", url.origin));
  if (!type || !id) {
    return assetResponse;
  }

  const apiKey = env.TMDB_API_KEY || env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    return assetResponse;
  }

  try {
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${encodeURIComponent(
        apiKey
      )}&append_to_response=images`,
      { headers: { Accept: "application/json" } }
    );

    if (!tmdbRes.ok) {
      return assetResponse;
    }

    const data = (await tmdbRes.json()) as TmdbMetaPayload;
    const rawTitle = type === "tv" ? data.name : data.title;
    if (!rawTitle) {
      return assetResponse;
    }

    const pageTitle = `${rawTitle} ${
      type === "tv" ? "(TV Series)" : "(Movie)"
    } - MovieZone`;
    const description = buildDescription(data.overview, rawTitle);

    let backdropPath = data.backdrop_path || null;
    if (!backdropPath && data.images?.backdrops?.length) {
      const sorted = [...data.images.backdrops].sort(
        (a, b) => (b.vote_average || 0) - (a.vote_average || 0)
      );
      backdropPath = sorted[0]?.file_path || null;
    }

    // Use w1280 (~200-400KB) so WhatsApp/Facebook/Discord/X never drop oversized images
    const ogImage = backdropPath
      ? `https://image.tmdb.org/t/p/w1280${backdropPath}`
      : data.poster_path
      ? `https://image.tmdb.org/t/p/w780${data.poster_path}`
      : `${url.origin}/movie-zone.png`;

    const canonicalUrl = `${url.origin}/info/${type}/${id}`;

    // HTMLRewriter is available globally in Cloudflare Pages / Workers runtime
    const RewriterCtor = (
      globalThis as unknown as {
        HTMLRewriter?: new () => {
          on: (selector: string, handler: object) => unknown;
          transform: (response: Response) => Response;
        };
      }
    ).HTMLRewriter;

    if (!RewriterCtor) {
      return assetResponse;
    }

    const rewriter = new RewriterCtor();
    rewriter.on("title", new TitleTextRewriter(pageTitle));
    rewriter.on(
      "meta[name]",
      new MetaAttributeRewriter("name", {
        description,
        "twitter:title": pageTitle,
        "twitter:description": description,
        "twitter:image": ogImage,
      })
    );
    rewriter.on(
      "meta[property]",
      new MetaAttributeRewriter("property", {
        "og:title": pageTitle,
        "og:description": description,
        "og:image": ogImage,
        "og:image:secure_url": ogImage,
        "og:url": canonicalUrl,
        "og:type": type === "tv" ? "video.tv_show" : "video.movie",
      })
    );

    const rewritten = rewriter.transform(assetResponse);
    const headers = new Headers(rewritten.headers);
    headers.set("Cache-Control", "public, max-age=1800");
    return new Response(rewritten.body, {
      status: rewritten.status,
      headers,
    });
  } catch {
    return assetResponse;
  }
}
