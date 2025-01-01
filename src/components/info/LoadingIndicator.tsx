import React from 'react';

const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="w-16 h-16 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin"></div>
          {/* Inner spinning ring */}
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-blue-500 rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
          {/* Glow effect */}
          <div className="absolute inset-0 w-16 h-16 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-200 mb-1">Loading</h3>
          <p className="text-sm text-gray-400">Fetching download options...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
