import React, { useState } from "react";
import { Movie } from "../../types/movie";

interface InfoDetailsProps {
  content: Movie;
}

export const InfoDetails: React.FC<InfoDetailsProps> = ({ content }) => {
  // Track loading state for each company logo by id
  const [logoLoaded, setLogoLoaded] = useState<{ [id: number]: boolean }>({});

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Details Card */}
      <div className="liquid-glass rounded-[28px] p-6 sm:p-7 text-white space-y-5">
        <h3 className="font-display text-lg font-semibold text-white">About</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {content.release_date && (
            <div className="glass-chip rounded-2xl p-3.5">
              <div className="text-neutral-400 text-xs mb-1">Release Date</div>
              <div className="font-medium text-white">
                {new Date(content.release_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          )}
          {content.runtime && content.runtime > 0 && (
            <div className="glass-chip rounded-2xl p-3.5">
              <div className="text-neutral-400 text-xs mb-1">Runtime</div>
              <div className="font-medium text-white">
                {Math.floor(content.runtime / 60)}h {content.runtime % 60}m
              </div>
            </div>
          )}
          {content.vote_average > 0 && (
            <div className="glass-chip rounded-2xl p-3.5 sm:col-span-2">
              <div className="text-neutral-400 text-xs mb-1">Audience Score</div>
              <div className="font-medium text-white">
                {Math.round(content.vote_average * 10)}%
                <span className="text-neutral-400 text-xs ml-2">
                  ({content.vote_count.toLocaleString()} votes)
                </span>
              </div>
            </div>
          )}
        </div>
        {content.genres && content.genres.length > 0 && (
          <div>
            <div className="text-neutral-400 text-xs mb-2">Genres</div>
            <div className="flex flex-wrap gap-2">
              {content.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="glass-chip px-3.5 py-1 rounded-full text-xs sm:text-sm font-medium text-neutral-200"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Production Companies Card */}
      {content.production_companies &&
        content.production_companies.length > 0 && (
          <div className="liquid-glass rounded-[28px] p-6 sm:p-7 text-white">
            <h3 className="font-display text-lg font-semibold mb-5">Production</h3>
            <div className="flex flex-wrap gap-3">
              {content.production_companies.map((company) => (
                <div
                  key={company.id}
                  className="glass-chip flex items-center gap-3 rounded-2xl px-4 py-3"
                >
                  {company.logo_path ? (
                    <div className="relative h-7 flex items-center">
                      <img
                        src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                        alt={company.name}
                        className="h-7 object-contain brightness-0 invert opacity-85"
                        style={{
                          opacity: logoLoaded[company.id] ? 0.85 : 0,
                          transition: "opacity 0.3s",
                        }}
                        onLoad={() =>
                          setLogoLoaded((prev) => ({
                            ...prev,
                            [company.id]: true,
                          }))
                        }
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          setLogoLoaded((prev) => ({
                            ...prev,
                            [company.id]: true,
                          }));
                        }}
                      />
                      {!logoLoaded[company.id] && (
                        <div className="h-7 w-20 bg-white/[0.06] animate-pulse rounded" />
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-neutral-200 font-medium">{company.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </section>
  );
};
