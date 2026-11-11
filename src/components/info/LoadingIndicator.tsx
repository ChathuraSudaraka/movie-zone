import React from "react";

const LoadingIndicator: React.FC = () => {
  return (
    <div className="glass-chip flex flex-col items-center justify-center gap-4 p-8 min-h-[200px] rounded-[22px] text-center">
      <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.04] border border-white/15">
        <div className="h-6 w-6 rounded-full border-2 border-white/15 border-t-white animate-spin" />
      </div>
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">
          Finding Available Releases
        </h3>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Checking mirrors and collecting download options...
        </p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
