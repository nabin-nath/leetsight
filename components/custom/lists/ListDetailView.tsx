"use client";
import { Badge } from "@/components/ui/badge";
import { ListDetail } from "@/types";
import { Edit, Eye, Globe, ListChecks, Lock, Trash2 } from "lucide-react";
import React from "react";
// You might reuse QuestionCard from PostDetailPage or make a specific one
// For now, let's assume a simplified display or adapt the existing QuestionCard.
import QuestionCard from "@/components/custom/card/QuestionCard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyLists, updateListReaction } from "@/store/slices/allListsSlice";
import {
  removeQuestionFromListView,
  setListDetailReaction,
} from "@/store/slices/listDetailSlice";
import { toggleQuestionDoneStatus } from "@/store/slices/postDetailSlice";
import { deleteUserList, fetchUserLists } from "@/store/slices/userListSlice";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  RiThumbDownFill,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { HoverCardCustom } from "../card/HoverCard";
import { ListCreateUpdateModal } from "../modal/ListCreateUpdateModal";

interface ListDetailViewProps {
  listDetail: ListDetail | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  type: "public" | "my";
  // Add handlers for actions like removing a question from this list
}

export const ListDetailView: React.FC<ListDetailViewProps> = ({
  listDetail,
  status,
  error,
  type = "public",
}) => {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  const questionItemStatus = useAppSelector(
    (state) => state.postDetail.questionStatus
  );

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

  const handleRemoveQuestion = async (listId: string, questionId: string) => {
    if (!listId || !questionId) return;
    if (
      confirm("Are you sure you want to remove this question from the list?")
    ) {
      try {
        await dispatch(
          removeQuestionFromListView({ listId, questionId })
        ).unwrap();
        toast.success("Question removed from list.");
        // The listDetailSlice will optimistically update the questions array.
        // You might also want to dispatch an action to update question_count in allListsSlice.
      } catch (e: any) {
        toast.error(e.message || "Failed to remove question.");
      }
    }
  };

  const handleLikeDislike = async (actionType: "like" | "dislike") => {
    if (!user) {
      toast.error("Please login first");
      return;
    }
    if (!listDetail) return;

    let actionToDispatch: "like" | "dislike" | "remove";

    if (actionType === "like") {
      actionToDispatch = listDetail.is_liked ? "remove" : "like";
    } else {
      // actionType === 'dislike'
      actionToDispatch = listDetail.is_disliked ? "remove" : "dislike";
    }

    try {
      const response = await dispatch(
        updateListReaction({ listId: listDetail.id, action: actionToDispatch })
      ).unwrap();

      const { is_liked, is_disliked, likes_count, dislikes_count } = response; // Assuming the response contains these fields
      dispatch(
        setListDetailReaction({
          is_liked,
          is_disliked,
          likes_count,
          dislikes_count,
        })
      );
      toast.success("Reaction updated!");
    } catch (e: any) {
      toast.error(e || "Failed to update reaction.");
    }
  };

  const [editOpen, setEditOpen] = React.useState(false);

  if (status === "loading")
    return <div className="p-6 text-center">Loading list details...</div>;
  if (status === "failed")
    return (
      <div className="p-6 text-center text-destructive">Error: {error}</div>
    );
  if (!listDetail && status === "succeeded")
    return (
      <div className="p-6 text-center text-muted-foreground">
        List details not found.
      </div>
    );
  if (!listDetail) return null; // Should be handled by parent for "select a list" message

  async function handleDeleteList(id: string) {
    if (!id) return;
    if (
      confirm(
        "Are you sure you want to delete this list? This action cannot be undone."
      )
    ) {
      try {
        // Assuming there's a deleteList action in your store or an API call
        await dispatch(deleteUserList(id)).unwrap();
        toast.success("List deleted successfully.");

        // fetch updated lists again
        dispatch(fetchMyLists({ skip: 0, limit: 20 }));
        dispatch(fetchUserLists());
        router.push("/lists");
      } catch (e: any) {
        toast.error(e.message || "Failed to delete the list.");
      }
    }
  }

  return (
    <div className="space-y-6">
      <ListCreateUpdateModal
        open={editOpen}
        onOpenChange={setEditOpen}
        type="update"
        initialData={
          listDetail
            ? {
                id: listDetail.id,
                name: listDetail.name,
                description: listDetail.description,
                is_public: listDetail.is_public,
                tags: listDetail.tags,
                views: listDetail.views,
              }
            : undefined
        }
      />
      <div className="p-4 rounded-2xl border bg-card shadow-md space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{listDetail.name}</h1>
          <div className="flex gap-2">
            {user && type === "my" && (
              <span
                className="border hover:bg-accent cursor-pointer rounded-md p-1 flex items-center gap-1"
                onClick={() => setEditOpen(true)}
              >
                <Edit size={20} />
              </span>
            )}
            {user && type === "my" && (
              <span
                className="border hover:bg-accent cursor-pointer rounded-md p-1 flex items-center gap-1"
                onClick={() => {
                  handleDeleteList(listDetail.id);
                }}
              >
                <Trash2 size={20} />
              </span>
            )}
            <span className="border rounded-md p-1 flex items-center gap-1">
              {listDetail.is_public ? <Globe size={20} /> : <Lock size={20} />}
            </span>
          </div>
        </div>
        <p className="text-muted-foreground">{listDetail.description}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-3">
          {Array.isArray(listDetail?.tags) &&
            listDetail.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
        </div>
        <div className="flex justify-between space-x-4 text-sm text-muted-foreground mt-3">
          <div className="flex items-center gap-3">
            <span>
              <Eye size={14} className="inline mr-1" /> {listDetail.views} views
            </span>
            <span>
              <ListChecks size={14} className="inline mr-1" />{" "}
              {listDetail.questions_count} questions
            </span>

            <div className="flex justify-between">
              <div className="flex mt-auto">
                <div
                  className="flex p-1 rounded-md items-center gap-1 cursor-pointer hover:bg-accent"
                  onClick={() => handleLikeDislike("like")}
                >
                  {listDetail.is_liked ? (
                    <RiThumbUpFill size={16} />
                  ) : (
                    <RiThumbUpLine size={16} />
                  )}{" "}
                  {listDetail.likes_count}
                </div>
                <div
                  className="flex p-1 rounded-md items-center gap-1 cursor-pointer hover:bg-accent"
                  onClick={() => handleLikeDislike("dislike")}
                >
                  {listDetail.is_disliked ? (
                    <RiThumbDownFill size={16} />
                  ) : (
                    <RiThumbDownLine size={16} />
                  )}{" "}
                  {listDetail.dislikes_count}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center text-sm font-medium">
            <span className="mr-1">Created by -</span>
            {listDetail.user && (
              <HoverCardCustom
                title={`${listDetail.user.username}`}
                picture_url={listDetail.user.picture_url}
                full_name={listDetail.user.full_name}
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Questions in this List</h2>
        {Array.isArray(listDetail.questions) ? (
          listDetail.questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onToggleDone={() =>
                handleToggleQuestionDone(q.id, q.is_done ?? false)
              }
              isTogglingDone={questionItemStatus[q.id] === "loading"}
              onOpenSaveModal={() => {}}
              type="list"
            />
          ))
        ) : (
          <p className="text-muted-foreground">
            This list has no questions yet.
          </p>
        )}
      </div>
    </div>
  );
};
