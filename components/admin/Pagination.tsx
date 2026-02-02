import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
}: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Page navigation">
      <ul className="pagination justify-content-end mb-0">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            aria-label="Previous"
          >
            <span aria-hidden="true">&laquo;</span>
          </button>
        </li>

        {showPageNumbers &&
          getPageNumbers().map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <li key={`ellipsis-${index}`} className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              );
            }

            const pageNum = page as number;
            return (
              <li
                key={pageNum}
                className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
              >
                <button
                  className="page-link"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              </li>
            );
          })}

        <li
          className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}
        >
          <button
            className="page-link"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            aria-label="Next"
          >
            <span aria-hidden="true">&raquo;</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
