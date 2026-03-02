"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MatchesPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
}

export default function MatchesPagination({ page, totalPages, total, perPage }: MatchesPaginationProps) {
  const searchParams = useSearchParams();

  const buildUrl = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    return `/matches?${params.toString()}`;
  };

  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, total);

  return (
    <nav
      className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-4 border-t border-gray-200"
      aria-label="Matches pagination"
    >
      <p className="text-sm text-gray-600 order-2 sm:order-1">
        Showing <span className="font-semibold text-gray-900">{startItem}</span>–
        <span className="font-semibold text-gray-900">{endItem}</span> of{" "}
        <span className="font-semibold text-gray-900">{total}</span> matches
      </p>
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <Link
          href={page > 1 ? buildUrl(page - 1) : "#"}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            page <= 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
          aria-disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (page <= 4) {
              pageNum = i + 1;
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = page - 3 + i;
            }
            const isActive = pageNum === page;
            return (
              <Link
                key={pageNum}
                href={buildUrl(pageNum)}
                className={`min-w-[2.25rem] h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Page ${pageNum}`}
              >
                {pageNum}
              </Link>
            );
          })}
        </div>
        <Link
          href={page < totalPages ? buildUrl(page + 1) : "#"}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            page >= totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
          aria-disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </nav>
  );
}
