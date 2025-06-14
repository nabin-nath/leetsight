// src/store/slices/userListSlice.ts (or a similar path)

import apiClient from "@/lib/apiClient"; // Your API client
import { UserListItem, UserListsApiResponse } from "@/types/userList"; // Your types
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserListState {
  lists: UserListItem[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  status: "idle" | "loading" | "succeeded" | "failed"; // For fetch status
  error: string | null;
  createStatus: "idle" | "loading" | "succeeded" | "failed"; // For create status
  createError: string | null; // Error for create operation
  updateStatus: "idle" | "loading" | "succeeded" | "failed"; // For update status
  updateError: string | null; // Error for update operation
}

const initialState: UserListState = {
  lists: [],
  totalRecords: 0,
  totalPages: 1,
  currentPage: 1,
  hasNextPage: false,
  status: "idle", // Initially idle, not yet fetched
  createError: null, // Error for create operation
  updateStatus: "idle", // Status for update operation
  updateError: null, // Error for update operation
  createStatus: "idle", // Status for create operation
  error: null, // Error for fetch operation
};

export const createUserList = createAsyncThunk(
  "userList/createUserList",
  async (
    {
      name,
      description,
      is_public,
      tags,
    }: {
      name: string;
      description: string;
      is_public: boolean;
      tags: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post("/lists", {
        name,
        description,
        is_public,
        tags,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create list"
      );
    }
  }
);

export const deleteUserList = createAsyncThunk(
  "userList/deleteUserList",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/lists/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete list"
      );
    }
  }
);

export const updateUserList = createAsyncThunk(
  "userList/updateUserList",
  async (
    {
      id,
      name,
      description,
      is_public,
      tags,
      views,
    }: {
      id: string;
      name: string;
      description: string;
      is_public: boolean;
      tags: string[];
      views: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.put(`/lists/${id}`, {
        name,
        description,
        is_public,
        tags,
        views,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update list"
      );
    }
  }
);

// Async thunk for fetching user lists
export const fetchUserLists = createAsyncThunk<
  UserListsApiResponse, // Return type of the payload creator
  void, // First argument to the payload creator (void if no args)
  { rejectValue: string } // Types for ThunkAPI
>(
  "userLists/fetchUserLists", // Action type prefix
  async (_, { getState, rejectWithValue }) => {
    // console.log("Starting fetchUserLists thunk...");
    const state = getState() as { userLists: UserListState }; // Get current state if needed
    // console.log("Current userLists state:", state.userLists);
    // Prevent re-fetch if already succeeded or loading, unless forced (add force logic if needed)
    if (
      state?.userLists?.status === "succeeded" ||
      state?.userLists?.status === "loading"
    ) {
      // console.log(
      //   "User lists already fetched or loading. Skipping fetch."
      // )
      // If you want to allow forced refetch, you'd pass a parameter to the thunk
      // and check it here. For "fetch once", this is usually sufficient.
      // console.log("User lists already fetched or loading. Skipping.");
      // To make it truly "fetch once", we return the current data or handle it.
      // However, createAsyncThunk expects a promise. A common pattern is to
      // let it proceed and handle idempotency in the component dispatching it,
      // or return a specific value that indicates no fetch was made.
      // For simplicity here, we'll let it be dispatched and rely on component logic
      // not to dispatch if status is 'succeeded'.
      // Alternatively, to truly stop it here, you might need a custom condition:
      // if (state.userLists.status === 'succeeded') {
      //    return state.userLists; // This would require matching UserListState to UserListsApiResponse
      // }
    }

    try {
      // console.log("Fetching user lists via Redux Thunk...");
      const response = await apiClient.get<UserListsApiResponse>(
        "/users/me/lists?skip=0&limit=100"
      );
      // console.log("User lists fetched successfully:", response.data);
      if (response.status < 200 || response.status >= 300) {
        return rejectWithValue("Failed to fetch user lists");
      }
      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

const userListSlice = createSlice({
  name: "userLists",
  initialState,
  reducers: {
    // Reducer to add a list optimistically (example)
    addListOptimistic: (state, action: PayloadAction<UserListItem>) => {
      state.lists.unshift(action.payload); // Add to beginning
      state.totalRecords += 1;
      // You might need to adjust other pagination state if this affects it significantly
    },
    // Reducer to update a list optimistically
    updateListOptimistic: (state, action: PayloadAction<UserListItem>) => {
      const index = state.lists.findIndex(
        (list) => list.id === action.payload.id
      );
      if (index !== -1) {
        state.lists[index] = action.payload;
      }
    },
    // Reducer to remove a list optimistically
    removeListOptimistic: (state, action: PayloadAction<string>) => {
      // listId
      state.lists = state.lists.filter((list) => list.id !== action.payload);
      state.totalRecords -= 1;
    },
    // Reducer to directly set lists (e.g., after a create/update returns all lists)
    setAllLists: (state, action: PayloadAction<UserListsApiResponse>) => {
      state.lists = action.payload.items;
      state.totalRecords = action.payload.total_records;
      state.totalPages = action.payload.total_pages;
      state.currentPage = action.payload.current_page;
      state.hasNextPage = action.payload.has_next_page;
      state.status = "succeeded"; // Mark as succeeded if directly setting
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserLists.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUserLists.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.lists = action.payload.items;
        state.totalRecords = action.payload.total_records;
        state.totalPages = action.payload.total_pages;
        state.currentPage = action.payload.current_page;
        state.hasNextPage = action.payload.has_next_page;
        state.error = null;
      })
      .addCase(fetchUserLists.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to fetch lists"; // Use rejectValue
      })
      .addCase(createUserList.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createUserList.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.createError = null;
        // Optionally add the new list to state.lists here
      })
      .addCase(createUserList.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload as string;
      })
      .addCase(updateUserList.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(updateUserList.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.updateError = null;
        // Optionally update the list in state.lists here
      })
      .addCase(updateUserList.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload as string;
      })
      .addCase(deleteUserList.pending, (state) => {
        state.status = "loading"; // Reuse status for delete operation
        state.error = null;
      })
      .addCase(deleteUserList.fulfilled, (state, action) => {
        state.status = "succeeded"; // Reuse status for delete operation
        state.error = null;
        // Remove the deleted list from state.lists
        state.lists = state.lists.filter(
          (list) => list.id !== action.payload.id
        );
        state.totalRecords -= 1; // Adjust total records count
      })
      .addCase(deleteUserList.rejected, (state, action) => {
        state.status = "failed"; // Reuse status for delete operation
        state.error = action.payload as string; // Use rejectValue
      });
  },
});

// Export actions
export const {
  addListOptimistic,
  updateListOptimistic,
  removeListOptimistic,
  setAllLists,
} = userListSlice.actions;

// Export reducer
export default userListSlice.reducer;
