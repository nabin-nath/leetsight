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
      return rejectWithValue("Already loading this list detail");
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
      .addCase(fetchListDetails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load list details";
        state.selectedListDetail = null;
      })
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
      });
  },
});

export const { clearSelectedList, toggleQuestionDoneInListOptimistic } =
  listDetailSlice.actions;
export default listDetailSlice.reducer;
