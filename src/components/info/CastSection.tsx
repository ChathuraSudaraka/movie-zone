import React, { useState } from "react";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface CastSectionProps {
  cast: CastMember[];
}

const CastCard = React.memo(({ person }: { person: CastMember }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="group relative aspect-[2/3] overflow-hidden rounded-[20px] bg-neutral-900 ring-1 ring-white/15 transition-transform duration-300 ease-ios hover:-translate-y-1 hover:ring-white/35 shadow-[0_16px_40px_-14px_rgba(0,0,0,0.85)]">
      {person.profile_path ? (
        <>
          <img
            src={`https://image.tmdb.org/t/p/w300${person.profile_path}`}
            alt={person.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-ios group-hover:scale-105"
            onLoad={() => setLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://via.placeholder.com/300x450?text=No+Image";
              setLoaded(true);
            }}
            style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.25s" }}
          />
          {!loaded && (
            <div className="absolute inset-0 bg-white/[0.05] animate-pulse" />
          )}
        </>
      ) : (
        <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500">
          <span className="text-xs">No Image</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/65 to-transparent p-3.5 pt-10">
        <h3 className="font-display text-white font-semibold text-sm truncate">
          {person.name}
        </h3>
        <p className="text-neutral-300/80 text-xs truncate mt-0.5">
          {person.character}
        </p>
      </div>
    </div>
  );
});

export const CastSection: React.FC<CastSectionProps> = React.memo(({ cast }) => {
  return (
    <section className="row-perf">
      <h2 className="font-display text-xl sm:text-2xl font-semibold text-white mb-6">
        Top Cast
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {cast.slice(0, 6).map((person) => (
          <CastCard key={person.id} person={person} />
        ))}
      </div>
    </section>
  );
});
