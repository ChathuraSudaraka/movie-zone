import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="p-6 mx-auto max-w-2xl">
      <div className="bg-black/40 backdrop-blur-sm border border-red-500/20 p-5 rounded-xl 
                      transition-all duration-300 hover:bg-black/50 hover:border-red-500/40 
                      shadow-lg hover:shadow-red-500/10">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 mt-1">
            <svg 
              className="h-6 w-6 text-red-500/90 transition-colors duration-300 
                         hover:text-red-400 transform hover:scale-110" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div className="flex-1 space-y-1.5">
            <p className="text-red-500/90 font-semibold tracking-wide text-sm uppercase 
                         transition-colors duration-300 hover:text-red-400">
              Unable to Process Request
            </p>
            <p className="text-gray-300/90 text-sm leading-relaxed 
                         transition-colors duration-300 hover:text-gray-200/90">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
