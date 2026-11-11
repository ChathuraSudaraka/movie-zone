import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const calculatedPages = Math.ceil(totalItems / itemsPerPage);
  const totalPages = calculatedPages > 0 ? calculatedPages : 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  useEffect(() => {
    if (totalPages > 1 && totalItems > 0 && safePage !== currentPage) {
      onPageChange(safePage);
    }
  }, [safePage, currentPage, totalPages, totalItems, onPageChange]);

  if (totalPages <= 1 || totalItems === 0) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (showEllipsis) {
      if (currentPage <= 4) {
        for (let i = 1; i <= Math.min(5, totalPages); i++) pages.push(i);
        if (totalPages > 5) {
          pages.push("...");
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        if (totalPages > 5) {
          pages.push("...");
          for (let i = Math.max(totalPages - 4, 2); i <= totalPages; i++)
            pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (
          let i = currentPage - 1;
          i <= Math.min(currentPage + 1, totalPages);
          i++
        ) {
          pages.push(i);
        }
        if (currentPage + 1 < totalPages) {
          pages.push("...");
          pages.push(totalPages);
        }
      }
    } else {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    }

    return pages;
  };

  return (
    <div className="glass-chip w-full flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-[20px]">
      <div className="text-xs sm:text-sm text-neutral-400">
        <span>
          Page <strong className="text-neutral-200 font-medium">{safePage}</strong> of{" "}
          <strong className="text-neutral-200 font-medium">{totalPages}</strong>
        </span>
        <span className="mx-2 text-white/25">•</span>
        <span>{totalItems} total</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
            safePage === 1
              ? "text-neutral-600 cursor-not-allowed"
              : "bg-white/[0.06] text-neutral-300 hover:bg-white/15 hover:text-white border border-white/10"
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() =>
                typeof page === "number" ? onPageChange(page) : null
              }
              disabled={page === "..."}
              className={`min-w-[32px] h-8 px-2 flex items-center justify-center text-xs sm:text-sm font-medium rounded-full transition-colors ${
                page === safePage
                  ? "bg-white text-neutral-950 font-semibold shadow-sm"
                  : page === "..."
                  ? "text-neutral-500 cursor-default"
                  : "text-neutral-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === totalPages}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
            safePage === totalPages
              ? "text-neutral-600 cursor-not-allowed"
              : "bg-white/[0.06] text-neutral-300 hover:bg-white/15 hover:text-white border border-white/10"
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
