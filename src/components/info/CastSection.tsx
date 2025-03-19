import React from "react";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface CastSectionProps {
  cast: CastMember[];
}

export const CastSection: React.FC<CastSectionProps> = ({ cast }) => {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold text-white mb-6">
        Top Cast
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {cast.slice(0, 6).map((person) => (
          <div key={person.id} className="group">
            <div className="aspect-[2/3] relative overflow-hidden rounded-md mb-2">
              {person.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w300${person.profile_path}`}
                  alt={person.name}
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://via.placeholder.com/300x450?text=No+Image";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-sm">No Image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm truncate">
                {person.name}
              </h3>
              <p className="text-gray-400 text-sm truncate">
                {person.character}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
