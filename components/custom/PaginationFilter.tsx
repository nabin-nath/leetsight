"use client";

import React, { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CustomPaginationProps {
  count: number; // total number of pages
  initialPage?: number;
  onChange?: (page: number) => void;
}

export function PaginationDemo({
  count,
  initialPage = 1,
  onChange,
}: CustomPaginationProps) {
  const [page, setPage] = useState(initialPage);

  const visibleRange = 5;
  const start = Math.max(1, page - Math.floor(visibleRange / 2));
  const end = Math.min(count, start + visibleRange - 1);

  // Adjust the window if it overflows
  const adjustedStart = Math.max(1, Math.min(start, count - visibleRange + 1));
  const adjustedEnd = Math.min(count, adjustedStart + visibleRange - 1);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > count) return;
    setPage(newPage);
    onChange?.(newPage);
  };

  const renderPageLinks = () => {
    const links = [];
    for (let i = adjustedStart; i <= adjustedEnd; i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={i === page}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return links;
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(page - 1);
            }}
          />
        </PaginationItem>

        {adjustedStart > 1 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {renderPageLinks()}

        {adjustedEnd < count && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(page + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
