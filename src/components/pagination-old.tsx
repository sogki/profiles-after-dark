import { Button } from "./ui/button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setPage: (p: number) => void;
  paginationItemsToDisplay?: number;
}

export default function PaginationOld({
  currentPage: page,
  totalPages,
  itemsPerPage,
  setPage,
}: PaginationProps) {
  return (
    totalPages > itemsPerPage && (
      <div className="flex items-center justify-center gap-4 mt-12">
        <Button
          onClick={() => setPage(Math.max(page - 1, 1))}
          disabled={page === 1}
          size="lg"
          className="h-12"
          aria-label="Previous page"
          type="button"
        >
          Previous
        </Button>

        <div className="flex items-center gap-2 py-1">
          {Array.from({
            length: Math.min(5, Math.ceil(totalPages / itemsPerPage)),
          }).map((_, i: number) => {
            const pageNum: number = i + 1;
            return (
              <Button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                size="lg"
                variant={page === pageNum ? "default" : "outline"}
                className={`w-12 h-12 rounded-lg font-medium transition-colors}`}
              >
                {pageNum}
              </Button>
            );
          })}
          {Math.ceil(totalPages / itemsPerPage) > 5 && (
            <>
              <span className="text-gray-400">...</span>
              <Button
                onClick={() => setPage(Math.ceil(totalPages / itemsPerPage))}
                size="lg"
                className={`w-12 h-12 rounded-lg font-medium transition-colors}`}
              >
                {Math.ceil(totalPages / itemsPerPage)}
              </Button>
            </>
          )}
        </div>

        <Button
          onClick={() =>
            setPage(Math.min(page + 1, Math.ceil(totalPages / itemsPerPage)))
          }
          size="lg"
          disabled={page === Math.ceil(totalPages / itemsPerPage)}
          className="h-12"
          aria-label="Next page"
          type="button"
        >
          Next
        </Button>
      </div>
    )
  );
}
