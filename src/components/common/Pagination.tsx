import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  // Calculate real total pages
  const calculatedPages = Math.ceil(totalItems / itemsPerPage);
  const totalPages = calculatedPages > 0 ? calculatedPages : 1;
  
  // Don't show pagination if there's only one page or no items
  if (totalPages <= 1 || totalItems === 0) return null;

  // Ensure current page is within bounds
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  if (safePage !== currentPage) {
    onPageChange(safePage);
    return null;
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;
    
    if (showEllipsis) {
      if (currentPage <= 4) {
        // Show first 5 pages + ellipsis + last page
        for (let i = 1; i <= Math.min(5, totalPages); i++) pages.push(i);
        if (totalPages > 5) {
          pages.push('...');
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 3) {
        // Show first page + ellipsis + last 5 pages
        pages.push(1);
        if (totalPages > 5) {
          pages.push('...');
          for (let i = Math.max(totalPages - 4, 2); i <= totalPages; i++) pages.push(i);
        }
      } else {
        // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= Math.min(currentPage + 1, totalPages); i++) {
          pages.push(i);
        }
        if (currentPage + 1 < totalPages) {
          pages.push('...');
          pages.push(totalPages);
        }
      }
    } else {
      // Show all pages when total pages is small
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-4 py-3
                  bg-[#1a1a1a]/90 border border-gray-800/50 rounded-xl">
      {/* Info */}
      <div className="text-sm text-gray-400">
        <span>Page {currentPage} of {totalPages}</span>
        <span className="mx-2">•</span>
        <span>{totalItems} Episodes</span>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-1.5">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
            ${currentPage === 1
              ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
              : 'bg-[#232323] hover:bg-red-500/20 hover:text-red-500 text-gray-400'
            }`}
        >
          <FaChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Pages */}
        <div className="flex items-center">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' ? onPageChange(page) : null}
              disabled={page === '...'}
              className={`min-w-[32px] h-8 flex items-center justify-center text-sm font-medium
                         rounded-lg transition-colors
                ${page === currentPage
                  ? 'bg-red-500 text-white'
                  : page === '...'
                    ? 'text-gray-500 cursor-default px-1'
                    : 'hover:bg-red-500/20 hover:text-red-500 text-gray-400'
                }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
            ${currentPage === totalPages
              ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
              : 'bg-[#232323] hover:bg-red-500/20 hover:text-red-500 text-gray-400'
            }`}
        >
          <span className="hidden sm:inline">Next</span>
          <FaChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
