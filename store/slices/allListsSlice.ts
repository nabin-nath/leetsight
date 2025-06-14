// src/store/slices/allListsSlice.ts (New name or refactor userListSlice)
import apiClient from "@/lib/apiClient";
import {
  AllListsState,
  PaginatedListState,
  UserListItem,
  UserListsApiResponse,
} from "@/types";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialPaginatedState: PaginatedListState<UserListItem> = {
  items: [],
  totalRecords: 0,
  totalPages: 1,
  currentPage: 1,
  hasNextPage: false,
  status: "idle",
  error: null,
};

const initialState: AllListsState = {
  myLists: { ...initialPaginatedState },
  publicLists: { ...initialPaginatedState },
};

interface FetchListsPayload {
  listType: "my" | "public";
  skip?: number;
  limit?: number;
  // Add other filter/search params if your API supports them
  searchTerm?: string;
}

// Generic thunk creator for fetching lists
const createFetchListsThunk = (listType: "my" | "public") => {
  return createAsyncThunk<
    UserListsApiResponse & { listType: "my" | "public" }, // Include listType in fulfilled payload
    Omit<FetchListsPayload, "listType">, // Args: skip, limit, searchTerm
    { rejectValue: string; state: { allLists: AllListsState } }
  >(
    `allLists/fetch${listType === "my" ? "My" : "Public"}Lists`,
    async (params, { rejectWithValue, getState }) => {
      console.log(`Fetching ${listType} lists with params:`, params);
      const currentListState =
        listType === "my"
          ? getState().allLists.myLists
          : getState().allLists.publicLists;
      // Basic "fetch once" or "don't fetch if loading"
      // More sophisticated caching/invalidation might be needed for pagination/search
      //   if (currentListState.status === 'loading') {
      //      return rejectWithValue('Fetch already in progress'); // Or handle differently
      //   }
      // If params haven't changed and data is succeeded, consider not re-fetching (more complex)

      const endpoint = listType === "my" ? "/users/me/lists" : "/lists";
      const queryParams = new URLSearchParams();
      queryParams.append("skip", String(params.skip || 0));
      queryParams.append("limit", String(params.limit || 20));
      //   if (params.searchTerm) queryParams.append('q', params.searchTerm); // Assuming 'q' for search

      try {
        console.log(
          `Making API call to ${endpoint} with params:`,
          queryParams.toString()
        );
        const response = await apiClient.get<UserListsApiResponse>(
          `${endpoint}?${queryParams.toString()}`
        );
        if (response.status < 200 || response.status >= 300) {
          return rejectWithValue(
            response.data.error || `Failed to fetch ${listType} lists`
          );
        }
        return { ...response.data, listType };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "An unknown error occurred";
        return rejectWithValue(message);
      }
    }
  );
};

export const fetchMyLists = createFetchListsThunk("my");
export const fetchPublicLists = createFetchListsThunk("public");

// --- List Reaction Thunk ---
export const updateListReaction = createAsyncThunk<
  // Response type (adjust as needed)
  {
    item_id: string;
    user_id: string;
    is_like: boolean | null;
    status: "added" | "removed" | "updated";
    originalAction: "like" | "dislike" | "remove";
    listId: string;
    is_liked: boolean;
    is_disliked: boolean;
    likes_count: number;
    dislikes_count: number;
  },
  // Arg type
  { listId: string; action: "like" | "dislike" | "remove" },
  { rejectValue: string }
>(
  "allLists/updateListReaction",
  async ({ listId, action }, { rejectWithValue }) => {
    try {
      let response;
      if (action === "remove") {
        response = await apiClient.delete(`/lists/${listId}/like`);
      } else {
        response = await apiClient.post(`/lists/${listId}/like`, {
          is_like: action === "like",
        });
      }
      if (response.status < 200 || response.status >= 300) {
        return rejectWithValue(
          response.data?.error || "Failed to update list reaction"
        );
      }

      return {
        ...response.data,
        originalAction: action,
        listId,
      };
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update list reaction"
      );
    }
  }
);

const allListsSlice = createSlice({
  name: "allLists",
  initialState,
  reducers: {
    clearMyLists: (state) => {
      state.myLists = { ...initialPaginatedState };
    },
    clearPublicLists: (state) => {
      state.publicLists = { ...initialPaginatedState };
    },
    // Add reducers for optimistic updates if a list is created/deleted/updated
    // e.g., after creating a new list, add it to state.myLists.items
  },
  extraReducers: (builder) => {
    [fetchMyLists, fetchPublicLists].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state, action) => {
          const listType =
            action.meta.arg.listType ||
            (action.type.includes("My") ? "my" : "public"); // Infer listType
          const targetState =
            listType === "my" ? state.myLists : state.publicLists;
          targetState.status = "loading";
          targetState.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          const { listType, ...data } = action.payload;
          const targetState =
            listType === "my" ? state.myLists : state.publicLists;
          targetState.status = "succeeded";
          targetState.items = data.items; // Replace or append based on pagination strategy
          targetState.totalRecords = data.total_records;
          targetState.totalPages = data.total_pages;
          targetState.currentPage = data.current_page;
          targetState.hasNextPage = data.has_next_page;
        })
        .addCase(thunk.rejected, (state, action) => {
          const listType =
            action.meta.arg.listType ||
            (action.type.includes("My") ? "my" : "public"); // Infer listType
          const targetState =
            listType === "my" ? state.myLists : state.publicLists;
          targetState.status = "failed";
          targetState.error = action.payload ?? `Failed to fetch lists`;
        });
    });

    builder.addCase(updateListReaction.fulfilled, (state, action) => {
      const { item_id, is_liked, is_disliked, likes_count, dislikes_count } =
        action.payload;

      [state.myLists, state.publicLists].forEach((listState) => {
        const list = listState.items.find((l) => l.id === item_id);
        if (list) {
          list.is_liked = is_liked;
          list.is_disliked = is_disliked;
          list.likes_count = likes_count;
          list.dislikes_count = dislikes_count;
        }
      });
    });
  },
});

export const { clearMyLists, clearPublicLists } = allListsSlice.actions;
export default allListsSlice.reducer;
