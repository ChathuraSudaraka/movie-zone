import React from "react";
import { Movie } from "../../types/movie";

interface InfoDetailsProps {
  content: Movie;
}

export const InfoDetails: React.FC<InfoDetailsProps> = ({ content }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Details */}
      <div className="text-white space-y-4">
        <div>
          <span className="text-gray-400 text-sm">Release Date: </span>
          <span className="font-medium">
            {new Date(content.release_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        {content.runtime && (
          <div>
            <span className="text-gray-400 text-sm">Runtime: </span>
            <span className="font-medium">
              {Math.floor(content.runtime / 60)}h {content.runtime % 60}m
            </span>
          </div>
        )}
        {content.genres && content.genres.length > 0 && (
          <div>
            <span className="text-gray-400 text-sm">Genres: </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {content.genres.map((genre: any) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-gray-800 rounded-full text-sm font-medium"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {content.vote_average && (
          <div>
            <span className="text-gray-400 text-sm">Rating: </span>
            <span className="font-medium">
              {Math.round(content.vote_average * 10)}%
              <span className="text-gray-400 text-sm ml-1">
                ({content.vote_count.toLocaleString()} votes)
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Production Companies */}
      {content.production_companies &&
        content.production_companies.length > 0 && (
          <div className="text-white">
            <h3 className="text-lg font-semibold mb-3">Production</h3>
            <div className="space-y-4">
              {content.production_companies.map((company: any) => (
                <div key={company.id} className="flex items-center gap-3">
                  {company.logo_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                      alt={company.name}
                      className="h-8 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-sm">{company.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};
