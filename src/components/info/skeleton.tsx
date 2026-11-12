import React from "react";

export const LoadingSkeleton: React.FC = () => (
  <div className="w-full min-h-screen relative bg-ink-950">
    {/* Hero Section Skeleton */}
    <div className="relative min-h-[85vh] w-full flex items-end pt-28 pb-10 md:pb-14">
      <div className="absolute inset-0 bg-white/[0.03] animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent" />

      <div className="relative z-10 w-full px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end gap-6 lg:gap-10">
          {/* Desktop Poster Placeholder */}
          <div className="hidden md:block shrink-0 w-44 lg:w-52 aspect-[2/3] rounded-[22px] bg-white/[0.05] ring-1 ring-white/10 animate-pulse" />

          <div className="flex-1 space-y-5">
            <div className="h-10 sm:h-14 w-3/4 max-w-xl rounded-2xl bg-white/[0.06] animate-pulse" />

            <div className="flex flex-wrap items-center gap-2.5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-7 w-20 rounded-full bg-white/[0.05] ring-1 ring-white/10 animate-pulse"
                />
              ))}
            </div>

            <div className="space-y-2.5 max-w-2xl">
              <div className="h-4 w-full rounded-lg bg-white/[0.05] animate-pulse" />
              <div className="h-4 w-5/6 rounded-lg bg-white/[0.05] animate-pulse" />
              <div className="h-4 w-2/3 rounded-lg bg-white/[0.05] animate-pulse" />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-11 w-40 rounded-full bg-white/[0.08] animate-pulse" />
              <div className="h-11 w-28 rounded-full bg-white/[0.05] animate-pulse" />
              <div className="h-11 w-11 rounded-full bg-white/[0.05] animate-pulse" />
              <div className="h-11 w-11 rounded-full bg-white/[0.05] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Details & Cast Skeleton */}
    <div className="px-4 py-10 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="liquid-glass rounded-[28px] p-6 sm:p-7 space-y-4">
          <div className="h-7 w-48 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="h-24 w-full rounded-2xl bg-white/[0.04] animate-pulse" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-[20px] bg-white/[0.04] ring-1 ring-white/10 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);
