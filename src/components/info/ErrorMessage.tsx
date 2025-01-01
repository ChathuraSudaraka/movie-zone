import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="p-8 mx-auto max-w-2xl">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-l-4 border-red-500 p-6 rounded-lg shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="relative">
              <svg className="h-8 w-8 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-500 mb-1">Error</h3>
            <p className="text-gray-300">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
