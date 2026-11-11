import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#060608] px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-neutral-900/80 p-8 rounded-lg border border-neutral-800 text-center">
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-600/10 text-brand-500">
            <span className="text-4xl font-bold">404</span>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-white">Page Not Found</h2>
            <p className="mt-4 text-gray-400">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition"
            >
              <Home size={18} />
              <span>Back to Home</span>
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-md hover:bg-neutral-600 transition"
            >
              <ArrowLeft size={18} />
              <span>Go Back</span>
            </button>
          </div>
        </div>
        
        <div className="pt-6 mt-8 border-t border-neutral-800">
          <p className="text-sm text-gray-500">
            Looking for something specific? Try using the search feature or navigate using the menu.
          </p>
        </div>
      </div>
    </div>
  );
}