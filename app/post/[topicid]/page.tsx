"use client";

import { Badge } from "@/components/ui/badge";
import { addQuestionToList } from "@/store/slices/postDetailSlice"; // Import the new thunk
import {
  ArrowLeftCircle,
  Briefcase,
  Building2,
  ExternalLink,
  Eye,
  Flame,
  Tag,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  RiThumbDownFill,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine,
} from "react-icons/ri";
import { toast } from "sonner";

// Redux imports
import QuestionCard from "@/components/custom/card/QuestionCard";
import { SaveToListModal } from "@/components/custom/saveToList";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearPostDetail,
  fetchPostAndQuestions,
  toggleQuestionDoneStatus,
  updatePostReaction,
  updateQuestionInList,
} from "@/store/slices/postDetailSlice";
import { fetchUserLists } from "@/store/slices/userListSlice"; // To refresh list counts

// formatDate can remain the same
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const topicIdFromUrl = params?.topicid as string;

  const { data: session } = useSession();
  const user = session?.user;

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [selectedQuestionIdForSave, setSelectedQuestionIdForSave] = useState<
    string | null
  >(null);
  const [currentlySavingToListId, setCurrentlySavingToListId] = useState<
    string | null
  >(null); // For loading indicator on list item

  const [listInteractionStatus, setListInteractionStatus] = useState<{
    [listId: string]: "saving" | "removing" | "added" | "failed" | "idle";
  }>({});
  const [listsContainingSelectedQuestion, setListsContainingSelectedQuestion] =
    useState<string[]>([]);

  // Selectors from Redux store
  const { post, questions, status, error } = useAppSelector(
    (state) => state.postDetail
  );

  const fetchedTopicIdRef = useRef<string | null>(null);

  const questionItemStatus = useAppSelector(
    (state) => state.postDetail.questionStatus
  );

  const openSaveModal = (questionId: string) => {
    if (!user) {
      toast.error("Please login to save questions.");
      return;
    }
    setSelectedQuestionIdForSave(questionId);
    const question = questions.find((q) => q.id === questionId); // Get the full question object from Redux state
    if (!question) return;

    setListsContainingSelectedQuestion(question.saved_in_lists || []);
    setIsSaveModalOpen(true);
  };

  const handleQuestionListUpdate = async (
    listId: string,
    questionId: string,
    action: "add" | "remove"
  ): Promise<boolean> => {
    if (!questionId) return false;

    setListInteractionStatus((prev) => ({
      ...prev,
      [listId]: action === "add" ? "saving" : "removing",
    }));

    try {
      await dispatch(
        updateQuestionInList({ listId, questionId, action })
      ).unwrap();
      toast.success(
        `Question ${action === "add" ? "added to" : "removed from"} list!`
      );

      // Optimistically update listsContainingSelectedQuestion
      if (action === "add") {
        setListsContainingSelectedQuestion((prev) => [...prev, listId]);
      } else {
        setListsContainingSelectedQuestion((prev) =>
          prev.filter((id) => id !== listId)
        );
      }
      setListInteractionStatus((prev) => ({
        ...prev,
        [listId]: action === "add" ? "added" : "idle",
      })); // 'added' or back to 'idle' for remove

      // IMPORTANT: Re-fetch user lists to update question_counts
      dispatch(fetchUserLists()); // No need for forceRefetch if your fetchUserLists thunk handles staleness or if you want fresh data

      return true;
    } catch (e: any) {
      toast.error(e.message || e || `Failed to ${action} question.`);
      setListInteractionStatus((prev) => ({ ...prev, [listId]: "failed" }));
      return false;
    }
  };

  const handleSaveQuestionToList = async (
    listId: string,
    questionId: string
  ): Promise<boolean> => {
    if (!questionId) return false;
    setCurrentlySavingToListId(listId); // Indicate saving to this specific list
    // OR setCurrentlySavingToListId("ANY"); // Indicate a save operation is in progress

    try {
      await dispatch(addQuestionToList({ listId, questionId })).unwrap();
      toast.success(`Question added to list!`);
      // Optionally, you might want to update the question object in postDetailSlice
      // to reflect it's been saved to *a* list, or refetch userLists to update counts.
      // For now, just a success toast.
      setCurrentlySavingToListId(null);
      return true; // Indicate success for closing modal
    } catch (e: any) {
      toast.error(e.message || e || "Failed to add question to list.");
      setCurrentlySavingToListId(null);
      return false; // Indicate failure
    }
  };

  useEffect(() => {
    // Ensure topicIdFromUrl is a valid number string before parsing
    const currentTopicIdNum = topicIdFromUrl
      ? parseInt(topicIdFromUrl, 10)
      : NaN;

    if (topicIdFromUrl && !isNaN(currentTopicIdNum)) {
      // Condition to fetch:
      // 1. The current topic ID from URL is different from the last fetched/loading topic ID.
      // OR
      // 2. The status is 'idle' (initial load for this component instance) and we haven't tried fetching this ID yet.
      // OR
      // 3. The status is 'failed' (previous attempt for this ID failed, allow retry).
      // AND
      // 4. We are not already 'loading' for the current topicIdFromUrl (to prevent multiple dispatches)
      //    (The `fetchedTopicIdRef.current === topicIdFromUrl && status === 'loading'` part handles this implicitly)

      const shouldFetch =
        (fetchedTopicIdRef.current !== topicIdFromUrl &&
          status !== "loading") || // New topic ID and not already loading
        (status === "idle" && fetchedTopicIdRef.current !== topicIdFromUrl) || // Initial load for this new topic ID
        (status === "failed" && fetchedTopicIdRef.current === topicIdFromUrl); // Retry for a failed fetch of the same topic ID

      if (shouldFetch) {
        // console.log(`Dispatching fetchPostAndQuestions for topicId: ${topicIdFromUrl}, current status: ${status}`);
        dispatch(fetchPostAndQuestions(topicIdFromUrl));
        fetchedTopicIdRef.current = topicIdFromUrl; // Mark this topicId as being fetched
      }
    }

    // Cleanup function:
    // This will run when the component unmounts OR when topicIdFromUrl changes BEFORE the next effect runs.
    return () => {
      // console.log("PostDetailPage: Cleanup effect for topicId:", topicIdFromUrl);
      // Only clear if the component is truly unmounting or if the topic ID fundamentally changes.
      // If the next topicId is different, we want fresh data anyway.
      // If we clear here, and then the component re-renders with the same topicIdFromUrl,
      // it might trigger a re-fetch if status became 'idle'.
      // A better approach might be to clear only on unmount if the data is specific to this instance.
      // Or, if the data is cached globally by topicId in Redux, clearing might not be desired
      // unless navigating completely away from any post detail view.
      // For now, let's assume clearPostDetail sets status to 'idle', which is fine if the next
      // topic ID is different. If it's the same, the 'shouldFetch' condition above needs to be robust.
      // This clear is more about resetting the *generic* postDetail slice if you navigate to a completely
      // different part of the app, not just another post.
      // dispatch(clearPostDetail()); // Consider the implications of this carefully.
    };
    // --- MODIFIED DEPENDENCY ARRAY ---
    // `dispatch` is stable.
    // `topicIdFromUrl` is the primary trigger.
    // `status` is needed to decide if a re-fetch/retry is necessary.
    // `post` is removed because its change is a *result* of the fetch, not a cause for re-fetching the *same* ID.
    // If `post.topic_id` was used to compare with `topicIdFromUrl`, it could stay, but `fetchedTopicIdRef` is more direct.
  }, [topicIdFromUrl, dispatch, status]);

  useEffect(() => {
    return () => {
      // console.log("PostDetailPage: Component unmounting, clearing post detail.");
      dispatch(clearPostDetail());
    };
  }, [dispatch]);

  const handleLikeDislike = async (actionType: "like" | "dislike") => {
    if (!user) {
      toast.error("Please login first");
      return;
    }
    if (!post) return;

    let actionToDispatch: "like" | "dislike" | "remove";

    if (actionType === "like") {
      actionToDispatch = post.is_liked ? "remove" : "like";
    } else {
      actionToDispatch = post.is_disliked ? "remove" : "dislike";
    }

    try {
      await dispatch(
        updatePostReaction({ topicId: post.topic_id, action: actionToDispatch })
      ).unwrap();
      toast.success("Reaction updated!");
    } catch (e: any) {
      toast.error(e || "Failed to update reaction.");
    }
  };

  const handleToggleQuestionDone = async (
    questionId: string,
    currentIsDone: boolean
  ) => {
    if (!user) {
      toast.error("Please login to track questions.");
      return;
    }
    try {
      await dispatch(
        toggleQuestionDoneStatus({ questionId, isDone: !currentIsDone })
      ).unwrap();
      toast.success(
        `Question marked as ${!currentIsDone ? "viewed" : "not viewed"}.`
      );
    } catch (e: any) {
      toast.error(e || "Failed to update question status.");
    }
  };

  const handleBackClick = () => {
    router.back();
  };

  if (status === "loading" && !post)
    // Show full page loader only if no post data yet
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground animate-pulse">Loading post details...</p>
      </div>
    );
  if (status === "failed")
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-destructive p-4 bg-destructive/10 rounded-md">
          Error: {error}
        </p>
      </div>
    );
  if (!post && status === "succeeded")
    // Successfully fetched but no post found for ID
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-muted-foreground">Post not found.</p>
      </div>
    );
  if (!post) return null; // Handles edge case where post is null but not loading/failed (e.g. after clear)

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-2">
      <div className="flex justify-between">
        <button
          onClick={handleBackClick}
          className="flex items-center text-sm text-muted-foreground mb-4 cursor-pointer"
        >
          <ArrowLeftCircle size={16} className="mr-1" /> Back to Posts
        </button>
        <Link
          href={`https://leetcode.com/discuss/post/${post.topic_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-sm text-muted-foreground mb-4 cursor-pointer"
        >
          View Post on Leetcode? <ExternalLink size={16} className="ml-1" />
        </Link>
      </div>

      <div className="p-6 rounded-2xl border bg-card shadow-md space-y-4">
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {post.companies.length > 0 && (
            <div className="flex items-center gap-2">
              {post.companies.map(
                (
                  com // removed id from map
                ) => (
                  <Badge variant="secondary" key={com.id}>
                    {" "}
                    {/* use com.id as key */}
                    <Building2 size={12} className="mr-1" />
                    {com.name}
                  </Badge>
                )
              )}
            </div>
          )}
          {post.roles.length > 0 && (
            <div className="flex items-center gap-2">
              {post.roles
                .filter((role) => role !== "N/A")
                .map((role, id) => (
                  <Badge variant="secondary" key={id}>
                    {" "}
                    {/* id as index is fine here */}
                    <Briefcase size={12} className="mr-1" />
                    {role}
                  </Badge>
                ))}
            </div>
          )}
          {typeof post.yoe === "number" && post.yoe > 0 && (
            <Badge variant="secondary">
              <Flame size={12} className="mr-1" />
              {post.yoe} Years of exp
            </Badge>
          )}
          {typeof post.views === "number" && post.views > 0 && (
            <Badge variant="secondary">
              <Eye size={12} className="mr-1" />
              {post.views}
            </Badge>
          )}
          <span>Created: {formatDate(post.leetcode_created_at)}</span>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground"
              >
                <Tag size={12} /> {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-2 mt-auto">
            <div
              className="flex p-1 rounded-md items-center gap-1 cursor-pointer hover:bg-accent"
              onClick={() => handleLikeDislike("like")}
            >
              {post.is_liked ? (
                <RiThumbUpFill size={16} />
              ) : (
                <RiThumbUpLine size={16} />
              )}{" "}
              {post.likes_count}
            </div>
            <div
              className="flex p-1 rounded-md items-center gap-1 cursor-pointer hover:bg-accent"
              onClick={() => handleLikeDislike("dislike")}
            >
              {post.is_disliked ? (
                <RiThumbDownFill size={16} />
              ) : (
                <RiThumbDownLine size={16} />
              )}{" "}
              {post.dislikes_count}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 mt-6">
        <h2 className="text-2xl font-bold border-b pb-2">
          Extracted Questions
        </h2>
        {status === "loading" && questions.length === 0 && (
          <p>Loading questions...</p>
        )}
        {questions.length > 0
          ? questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onToggleDone={() =>
                  handleToggleQuestionDone(question.id, question.is_done)
                }
                isTogglingDone={questionItemStatus[question.id] === "loading"}
                onOpenSaveModal={() => openSaveModal(question.id)}
              />
            ))
          : status === "succeeded" && (
              <p className="text-muted-foreground">
                No specific questions were extracted from this post.
              </p>
            )}

        {selectedQuestionIdForSave && (
          <SaveToListModal
            isOpen={isSaveModalOpen}
            onOpenChange={(open) => {
              setIsSaveModalOpen(open);
              if (!open) {
                // Reset interaction statuses when modal closes
                setListInteractionStatus({});
                setSelectedQuestionIdForSave(null);
              }
            }}
            questionId={selectedQuestionIdForSave}
            onQuestionListUpdate={handleQuestionListUpdate}
            listInteractionStatus={listInteractionStatus}
            listsContainingQuestion={listsContainingSelectedQuestion} // Pass this down
          />
        )}
      </div>
    </div>
  );
}
