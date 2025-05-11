// components/ui/pagination.tsx
import * as React from "react";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

interface PaginationRoundedProps {
  count: number; // Total number of pages
  page: number; // Current page
  onChange: (event: React.ChangeEvent<unknown>, page: number) => void;
}

export default function PaginationRounded({
  count,
  page,
  onChange,
}: PaginationRoundedProps) {
  return (
    <Stack
      spacing={2}
      direction="row"
      justifyContent="center"
      sx={{ marginTop: 4, marginBottom: 2 }}
    >
      <Pagination
        count={count}
        page={page}
        onChange={onChange}
        variant="outlined"
        shape="rounded"
        color="primary" // Or your theme color
      />
    </Stack>
  );
}
