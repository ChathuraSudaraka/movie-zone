import { BsGrid, BsListUl } from 'react-icons/bs';

interface ViewModeProps {
  viewMode: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

function ViewMode({ viewMode, onViewChange }: ViewModeProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-gray-900/50 rounded-lg backdrop-blur-sm">
      <button
        onClick={() => onViewChange("grid")}
        className={`p-2 rounded-md transition-all duration-300 ${
          viewMode === "grid" 
            ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" 
            : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white"
        }`}
      >
        <BsGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`p-2 rounded-md transition-all duration-300 ${
          viewMode === "list" 
            ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" 
            : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white"
        }`}
      >
        <BsListUl className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ViewMode;
