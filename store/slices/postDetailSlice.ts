// src/store/slices/postDetailSlice.ts
import apiClient from "@/lib/apiClient";
import { PostDetailState, PostResponse } from "@/types"; // Adjust path
import { UserListItem } from "@/types/userList";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: PostDetailState = {
  post: null,
  questions: [],
  status: "idle",
  error: null,
  questionStatus: {},
};

interface AddQuestionToListPayload {
  listId: string;
  questionId: string; // The ID of the question from the `Question` interface
}
interface AddQuestionToListResponse {
  // Define what your backend returns
  message: string; // e.g., "Question added to list successfully"
  // Potentially the updated list or question count for the list
  list?: UserListItem; // If backend returns the updated list
}

interface UpdateQuestionInListPayload {
  listId: string;
  questionId: string;
  action: "add" | "remove"; // Action type
}

interface UpdateQuestionInListResponse {
  // Define what your backend returns
  message: string;
  // Potentially the updated list or question count for the list
  list_id: string;
  question_id: string;
  action_performed: "add" | "remove";
  // If the backend returns the updated questions_count for the list:
  // new_questions_count?: number;
}

export const updateQuestionInList = createAsyncThunk<
  UpdateQuestionInListResponse, // What the thunk returns on success
  UpdateQuestionInListPayload, // What we pass to the thunk
  { rejectValue: string }
>(
  "postDetail/updateQuestionInList",
  async ({ listId, questionId, action }, { rejectWithValue }) => {
    try {
      // The API endpoint is the same, but the payload differs or method might differ.
      // Your description implies a POST/PUT with a payload. If remove is DELETE, adjust this.
      // Assuming POST for both add/remove based on your description needing a payload.
      const response = await apiClient.post(
        // Or PUT if more appropriate for update
        `/lists/${listId}/questions/${questionId}`,
        { action } // Send the action in the payload
      );

      if (response.status < 200 || response.status >= 300) {
        const errorData = response.data as any;
        return rejectWithValue(
          errorData.error ||
            `Failed to ${action} question ${
              action === "add" ? "to" : "from"
            } list`
        );
      }
      // Add action_performed to response so reducer knows what happened
      return {
        ...response.data,
        action_performed: action,
        list_id: listId,
        question_id: questionId,
      } as UpdateQuestionInListResponse;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

export const addQuestionToList = createAsyncThunk<
  AddQuestionToListResponse,
  AddQuestionToListPayload,
  { rejectValue: string }
>(
  "postDetail/addQuestionToList", // Or 'listActions/addQuestionToList' if in a separate slice
  async ({ listId, questionId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        `/lists/${listId}/questions/${questionId}`
      ); // Assuming POST request
      if (response.status < 200 || response.status >= 300) {
        // Use a more specific error message if available from response.data
        const errorData = response.data as any;
        return rejectWithValue(
          errorData.error || `Failed to add question to list`
        );
      }
      return response.data as AddQuestionToListResponse;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

// Thunk to fetch post and its questions
export const fetchPostAndQuestions = createAsyncThunk<
  PostResponse, // Return type
  string, // Argument: topicId
  { rejectValue: string }
>(
  "postDetail/fetchPostAndQuestions",
  async (topicId, { rejectWithValue, getState }) => {
    // Optional: Check if already fetched for this topicId to make it "fetch once per topicId"
    // const { postDetail } = getState() as { postDetail: PostDetailState };
    // if (postDetail.post?.topic_id === parseInt(topicId) && postDetail.status === 'succeeded') {
    //   return { post: postDetail.post, questions: postDetail.questions } as PostResponse;
    // }
    try {
      const response = await apiClient.get<PostResponse>(
        `/posts/${topicId}/questions`
      );
      if (response.status < 200 || response.status >= 300) {
        return rejectWithValue("Failed to fetch post details");
      }
      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

// Thunk for liking/disliking a post
interface ReactionPayload {
  topicId: number;
  isLike: boolean; // True for like, false for dislike
}
interface ReactionResponse {
  // Define what your backend returns on like/dislike
  is_liked: boolean;
  is_disliked: boolean;
  likes_count: number;
  dislikes_count: number;
}

export const updatePostReaction = createAsyncThunk<
  ReactionResponse & { originalAction: "like" | "dislike" | "remove" }, // Include original action for reducer
  { topicId: number; action: "like" | "dislike" | "remove" },
  { rejectValue: string }
>(
  "postDetail/updatePostReaction",
  async ({ topicId, action }, { rejectWithValue }) => {
    try {
      let response;
      if (action === "remove") {
        response = await apiClient.delete(`/posts/${topicId}/like`);
      } else {
        response = await apiClient.post(`/posts/${topicId}/like`, {
          is_like: action === "like",
        });
      }

      if (response.status < 200 || response.status >= 300) {
        return rejectWithValue(
          response.data.error || "Failed to update reaction"
        );
      }
      return { ...response.data, originalAction: action };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

// Thunk for marking a question as done/undone
interface MarkQuestionDonePayload {
  questionId: string;
  isDone: boolean;
}
interface MarkQuestionDoneResponse {
  question_id: string;
  is_done: boolean;
}
export const toggleQuestionDoneStatus = createAsyncThunk<
  MarkQuestionDoneResponse,
  MarkQuestionDonePayload,
  { rejectValue: string }
>(
  "postDetail/toggleQuestionDoneStatus",
  async ({ questionId, isDone }, { rejectWithValue }) => {
    try {
      // Replace with your actual API endpoint for marking questions
      const response = await apiClient.put(
        `/users/me/question-status/${questionId}`,
        {
          is_done: isDone,
        }
      );
      if (response.status < 200 || response.status >= 300) {
        return rejectWithValue(
          response.data.error || "Failed to update question status"
        );
      }
      return response.data as MarkQuestionDoneResponse; // Ensure backend returns this
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

const postDetailSlice = createSlice({
  name: "postDetail",
  initialState,
  reducers: {
    // Can be used to clear post detail when navigating away
    clearPostDetail: (state) => {
      state.post = null;
      state.questions = [];
      state.status = "idle";
      state.error = null;
      state.questionStatus = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Post and Questions
      .addCase(fetchPostAndQuestions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchPostAndQuestions.fulfilled,
        (state, action: PayloadAction<PostResponse>) => {
          state.status = "succeeded";
          state.post = action.payload.post;
          state.questions = action.payload.questions;
        }
      )
      .addCase(fetchPostAndQuestions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to fetch post";
        state.post = null;
        state.questions = [];
      })
      // Update Post Reaction
      .addCase(updatePostReaction.pending, (state) => {
        // Optionally set a loading state for the post reaction UI
      })
      .addCase(updatePostReaction.fulfilled, (state, action) => {
        if (state.post) {
          const { is_liked, is_disliked, likes_count, dislikes_count } =
            action.payload;
          state.post.is_liked = is_liked;
          state.post.is_disliked = is_disliked;
          state.post.likes_count = likes_count;
          state.post.dislikes_count = dislikes_count;
        }
      })
      .addCase(updatePostReaction.rejected, (state, action) => {
        // Optionally handle reaction error, maybe revert optimistic update
        console.error("Reaction update failed:", action.payload);
        // Toast can be shown in the component dispatching the action
      })
      // Toggle Question Done Status
      .addCase(toggleQuestionDoneStatus.pending, (state, action) => {
        state.questionStatus[action.meta.arg.questionId] = "loading";
      })
      .addCase(toggleQuestionDoneStatus.fulfilled, (state, action) => {
        const { question_id, is_done } = action.payload;
        const questionIndex = state.questions.findIndex(
          (q) => q.id === question_id
        );
        if (questionIndex !== -1) {
          state.questions[questionIndex].is_done = is_done;
        }
        state.questionStatus[question_id] = "succeeded";
      })
      .addCase(toggleQuestionDoneStatus.rejected, (state, action) => {
        if (action.meta.arg.questionId) {
          state.questionStatus[action.meta.arg.questionId] = "failed";
        }
        console.error("Toggle question done status failed:", action.payload);
      })
      .addCase(addQuestionToList.pending, (state, action) => {
        // Optionally, set a loading state for this specific question or list
        // e.g., state.questionStatus[action.meta.arg.questionId] = 'saving_to_list';
        // console.log(
        //   `Adding question ${action.meta.arg.questionId} to list ${action.meta.arg.listId}...`
        // );
      })
      .addCase(addQuestionToList.fulfilled, (state, action) => {
        // Handle success - maybe update list's question_count if returned
        // Or if the list item itself is returned, update it in the userListSlice (would require dispatching another action)
        // console.log("Question added to list successfully:", action.payload);
        // If the backend returns the updated list, you might dispatch an action
        // to update the userListSlice here, or the component can refetch userLists.
        // Example: if (action.payload.list) { /* dispatch action to update userListSlice */ }
      })
      .addCase(addQuestionToList.rejected, (state, action) => {
        console.error("Failed to add question to list:", action.payload);
        // Toast can be shown in the component
      })
      .addCase(updateQuestionInList.pending, (state, action) => {
        const { questionId, listId, action: listAction } = action.meta.arg;
        // console.log(
        //   `${
        //     listAction === "add" ? "Adding" : "Removing"
        //   } question ${questionId} ${
        //     listAction === "add" ? "to" : "from"
        //   } list ${listId}...`
        // );
        // You could set a specific loading state if needed:
        // state.questionStatus[questionId] = listAction === 'add' ? 'saving_to_list' : 'removing_from_list';
      })
      .addCase(updateQuestionInList.fulfilled, (state, action) => {
        const { message, list_id, question_id, action_performed } =
          action.payload;
        // console.log(
        //   `Question ${question_id} successfully ${action_performed} ${
        //     action_performed === "add" ? "to" : "from"
        //   } list ${list_id}: ${message}`
        // );
        // IMPORTANT: Here you need to decide how to update the UI.
        // 1. Invalidate/Refetch userLists: This is the safest to get updated question_counts.
        //    The component calling this thunk would dispatch `fetchUserLists({ forceRefetch: true })`.
        // 2. Optimistic update (if backend doesn't return updated list or count):
        //    If you had a `questions_count` in your `UserListItem` in `userListSlice`,
        //    you'd need to dispatch an action to that slice to increment/decrement it.
        //    This requires inter-slice communication or handling it in the component.

        // For now, we'll assume the component handles any necessary refetch of userLists.
        // If the question object itself needs an `is_saved_to_list_X` flag, update it here.
        // state.questionStatus[question_id] = 'succeeded';
      })
      .addCase(updateQuestionInList.rejected, (state, action) => {
        const { questionId, action: listAction } = action.meta.arg;
        console.error(
          `Failed to ${listAction} question ${questionId} ${
            listAction === "add" ? "to" : "from"
          } list:`,
          action.payload
        );
        // state.questionStatus[questionId] = 'failed';
      });
  },
});

export const { clearPostDetail } = postDetailSlice.actions;
export default postDetailSlice.reducer;
