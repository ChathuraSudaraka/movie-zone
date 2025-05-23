import React from 'react';

const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8 min-h-[220px] bg-zinc-900 rounded-xl shadow-lg">
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Brand new animation: Orbiting Dots with Platform Colors */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Central glowing core with Netflix red */}
          <div className="absolute inset-0 w-10 h-10 m-auto rounded-full bg-gradient-to-br from-red-600 via-red-500 to-zinc-900 blur-xl opacity-80 animate-orbit-core" />
          {/* Orbiting dots with platform colors */}
          <div className="absolute left-1/2 top-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-0 w-4 h-4 -translate-x-1/2 rounded-full bg-red-600 shadow-lg animate-orbit-dot1" />
            <div className="absolute right-0 top-1/2 w-4 h-4 -translate-y-1/2 rounded-full bg-zinc-400 shadow-lg animate-orbit-dot2" />
            <div className="absolute left-1/2 bottom-0 w-4 h-4 -translate-x-1/2 rounded-full bg-red-500 shadow-lg animate-orbit-dot3" />
            <div className="absolute left-0 top-1/2 w-4 h-4 -translate-y-1/2 rounded-full bg-zinc-700 shadow-lg animate-orbit-dot4" />
          </div>
        </div>
        <div className="text-center w-full">
          <h3 className="text-lg font-semibold text-white mb-1 tracking-wide">Loading</h3>
          <p className="text-sm text-gray-400">Fetching download options...</p>
        </div>
      </div>
      {/* Orbiting Dots Keyframes */}
      <style>{`
        @keyframes orbit-dot1 {
          0% { transform: rotate(0deg) translateY(-40px) scale(1); }
          50% { transform: rotate(180deg) translateY(-40px) scale(1.2); }
          100% { transform: rotate(360deg) translateY(-40px) scale(1); }
        }
        @keyframes orbit-dot2 {
          0% { transform: rotate(90deg) translateY(-40px) scale(1); }
          50% { transform: rotate(270deg) translateY(-40px) scale(1.2); }
          100% { transform: rotate(450deg) translateY(-40px) scale(1); }
        }
        @keyframes orbit-dot3 {
          0% { transform: rotate(180deg) translateY(-40px) scale(1); }
          50% { transform: rotate(360deg) translateY(-40px) scale(1.2); }
          100% { transform: rotate(540deg) translateY(-40px) scale(1); }
        }
        @keyframes orbit-dot4 {
          0% { transform: rotate(270deg) translateY(-40px) scale(1); }
          50% { transform: rotate(450deg) translateY(-40px) scale(1.2); }
          100% { transform: rotate(630deg) translateY(-40px) scale(1); }
        }
        .animate-orbit-dot1 { animation: orbit-dot1 2.2s linear infinite; transform-origin: 50% 50%; }
        .animate-orbit-dot2 { animation: orbit-dot2 2.2s linear infinite; transform-origin: 50% 50%; }
        .animate-orbit-dot3 { animation: orbit-dot3 2.2s linear infinite; transform-origin: 50% 50%; }
        .animate-orbit-dot4 { animation: orbit-dot4 2.2s linear infinite; transform-origin: 50% 50%; }
        @keyframes orbit-core {
          0%, 100% { filter: blur(16px) brightness(1); }
          50% { filter: blur(24px) brightness(1.2); }
        }
        .animate-orbit-core { animation: orbit-core 1.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default LoadingIndicator;
