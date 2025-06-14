// src/store/slices/listDetailSlice.ts
import apiClient from "@/lib/apiClient";
import { ListDetail, ListDetailReduxState } from "@/types"; // QuestionInList from types
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: ListDetailReduxState = {
  selectedListDetail: null,
  status: "idle",
  error: null,
};

export const fetchListDetails = createAsyncThunk<
  ListDetail, // Returns the full list detail including questions
  string, // Argument: listId
  { rejectValue: string; state: { listDetail: ListDetailReduxState } }
>(
  "listDetail/fetchListDetails",
  async (listId, { rejectWithValue, getState }) => {
    const { listDetail } = getState();
    // Fetch if different list or not yet succeeded for this list
    if (
      listDetail.selectedListDetail?.id === listId &&
      listDetail.status === "succeeded"
    ) {
      // console.log("Details for this list already loaded.");
      // return listDetail.selectedListDetail; // Return cached if desired
    }
    if (
      listDetail.status === "loading" &&
      listDetail.selectedListDetail?.id === listId
    ) {
      // return rejectWithValue("Already loading this list detail");
    }

    try {
      const response = await apiClient.get<ListDetail>(`/lists/${listId}`);
      if (response.status < 200 || response.status >= 300) {
        return rejectWithValue(
          response.data.error || "Failed to fetch list details"
        );
      }
      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

// Thunk to remove a question from a list (if this action is done from list detail view)
// This is similar to updateQuestionInList but specific context
interface RemoveQuestionFromListPayload {
  listId: string;
  questionId: string;
}
export const removeQuestionFromListView = createAsyncThunk<
  { listId: string; questionId: string }, // Return listId and questionId on success
  RemoveQuestionFromListPayload,
  { rejectValue: string }
>(
  "listDetail/removeQuestionFromListView",
  async ({ listId, questionId }, { rejectWithValue }) => {
    try {
      await apiClient.post(`/lists/${listId}/questions/${questionId}`, {
        action: "remove",
      });
      return { listId, questionId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove question";
      return rejectWithValue(message);
    }
  }
);

const listDetailSlice = createSlice({
  name: "listDetail",
  initialState,
  reducers: {
    clearSelectedList: (state) => {
      state.selectedListDetail = null;
      state.status = "idle";
      state.error = null;
    },
    // Optimistically update question's done status if needed from this view
    toggleQuestionDoneInListOptimistic: (
      state,
      action: PayloadAction<{ questionId: string; isDone: boolean }>
    ) => {
      if (state.selectedListDetail) {
        const question = state.selectedListDetail.questions.find(
          (q) => q.id === action.payload.questionId
        );
        if (question) {
          question.is_done = action.payload.isDone;
        }
      }
    },
    setListDetailReaction: (
      state,
      action: PayloadAction<{
        is_liked: boolean;
        is_disliked: boolean;
        likes_count: number;
        dislikes_count: number;
      }>
    ) => {
      if (state.selectedListDetail) {
        state.selectedListDetail.is_liked = action.payload.is_liked;
        state.selectedListDetail.is_disliked = action.payload.is_disliked;
        state.selectedListDetail.likes_count = action.payload.likes_count;
        state.selectedListDetail.dislikes_count = action.payload.dislikes_count;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchListDetails.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchListDetails.fulfilled,
        (state, action: PayloadAction<ListDetail>) => {
          state.status = "succeeded";
          state.selectedListDetail = action.payload;
        }
      )
      .addCase(removeQuestionFromListView.fulfilled, (state, action) => {
        if (
          state.selectedListDetail &&
          state.selectedListDetail.id === action.payload.listId
        ) {
          state.selectedListDetail.questions =
            state.selectedListDetail.questions.filter(
              (q) => q.id !== action.payload.questionId
            );
          state.selectedListDetail.questions_count -= 1;
        }
        // Also need to update the allListsSlice.myLists or publicLists for the question count.
        // This usually requires dispatching another action or handling in component.
      })
      .addCase(fetchListDetails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to fetch list details";
        // If the failed fetch was for the currently displayed list detail, clear it
        // or mark it as invalid to prevent re-fetch loop based on ID mismatch.
        // action.meta.arg is the listId that was attempted.
        if (state.selectedListDetail?.id === action.meta.arg) {
          // Option A: Clear it fully (safest to prevent loop if ID check is the main guard)
          // state.selectedListDetail = null;
          // Option B: Keep the old data but ensure the ID might not match,
          // or rely on status 'failed' to prevent re-fetch in the component.
          // For simplicity, clearing is often safer if the component re-fetches based on ID mismatch.
          // However, if the component checks status === 'failed' correctly, this might not be needed.
          // The component's useEffect check `selectedListDetail?.id !== selectedListIdFromUrl`
          // combined with `listDetailStatus === 'idle'` or `'failed'` should be the main guard.
          // If status is 'failed', the component should ideally show an error and a retry button,
          // not automatically re-fetch via this useEffect.
        }
      });
  },
});

export const { clearSelectedList, toggleQuestionDoneInListOptimistic } =
  listDetailSlice.actions;
export default listDetailSlice.reducer;
export const { setListDetailReaction } = listDetailSlice.actions;
