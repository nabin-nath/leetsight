import apiClient from "@/lib/apiClient";
import { Filters, ProcessedPost, RecentPostsApiResponse } from "@/types";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PostsState {
  items: ProcessedPost[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  // Store current filters that resulted in these posts for cache keying/comparison
  currentFilters: Filters | null;
}

const initialState: PostsState = {
  items: [],
  totalRecords: 0,
  totalPages: 1,
  currentPage: 1,
  status: "idle",
  error: null,
  currentFilters: null,
};

// Thunk expects a Filters object as argument
export const fetchPosts = createAsyncThunk<
  RecentPostsApiResponse,
  Filters,
  { rejectValue: string; state: { posts: PostsState } }
>("posts/fetchPosts", async (filters, { rejectWithValue, getState }) => {
  // Simple check for identical filters to avoid re-fetch if not needed.
  // Could be more sophisticated (e.g. deep equal).
  // const { posts } = getState();
  // if (JSON.stringify(posts.currentFilters) === JSON.stringify(filters) && posts.status === 'succeeded') {
  //    console.log("Posts for these filters already fetched. Skipping.");
  //    return posts as RecentPostsApiResponse; // Or handle differently
  // }

  let url = `/posts?skip=${(filters.page - 1) * filters.pageSize}&limit=${
    filters.pageSize
  }`;
  if (filters.companyId && filters.companyId !== "1000")
    url += `&company_id=${encodeURIComponent(filters.companyId)}`;
  if (filters.role && filters.role !== "All Roles")
    url += `&role=${encodeURIComponent(filters.role)}`;
  if (filters.fromDate) url += `&start_date=${filters.fromDate}`; // Expects yyyy-MM-dd
  if (filters.toDate) url += `&end_date=${filters.toDate}`; // Expects yyyy-MM-dd

  try {
    const response = await apiClient.get<RecentPostsApiResponse>(url);
    if (response.status < 200 || response.status >= 300) {
      const errorData = response.data as any;
      return rejectWithValue(errorData.error || "Failed to fetch posts");
    }
    return response.data; // This is RecentPostsApiResponse
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    // Could add reducers for optimistic updates to likes/dislikes if needed
    setCurrentPageOptimistic: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
      // When page changes, status might go back to idle or loading for new data
      state.status = "idle";
    },
    setFiltersOptimistic: (
      state,
      action: PayloadAction<Omit<Filters, "page">>
    ) => {
      state.currentFilters = {
        ...(state.currentFilters || { page: 1, pageSize: 10 }),
        ...action.payload,
        page: 1,
      };
      state.currentPage = 1;
      state.status = "idle"; // Filters changed, new data needed
      state.items = []; // Clear old items
      state.totalRecords = 0;
      state.totalPages = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state, action) => {
        state.status = "loading";
        state.currentFilters = action.meta.arg; // Store the filters used for this fetch attempt
      })
      .addCase(
        fetchPosts.fulfilled,
        (state, action: PayloadAction<RecentPostsApiResponse>) => {
          state.status = "succeeded";
          state.items = action.payload.items;
          state.totalRecords = action.payload.total_records;
          state.totalPages = action.payload.total_pages;
          state.currentPage = action.payload.current_page; // Comes from API
          state.error = null;
        }
      )
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to fetch posts";
      });
  },
});

export const { setCurrentPageOptimistic, setFiltersOptimistic } =
  postsSlice.actions;
export default postsSlice.reducer;
