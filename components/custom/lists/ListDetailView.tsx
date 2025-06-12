// src/components/custom/lists/ListDetailView.tsx
"use client";
import { Badge } from "@/components/ui/badge";
import { ListDetail } from "@/types";
import { Eye, Globe, ListChecks, Lock } from "lucide-react";
import React from "react";
// You might reuse QuestionCard from PostDetailPage or make a specific one
// For now, let's assume a simplified display or adapt the existing QuestionCard.
import QuestionCard from "@/components/custom/card/QuestionCard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeQuestionFromListView } from "@/store/slices/listDetailSlice";
import { toggleQuestionDoneStatus } from "@/store/slices/postDetailSlice";
import { useSession } from "next-auth/react";
import {
  RiThumbDownFill,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine,
} from "react-icons/ri";
import { toast } from "sonner";

interface ListDetailViewProps {
  listDetail: ListDetail | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  // Add handlers for actions like removing a question from this list
}

export const ListDetailView: React.FC<ListDetailViewProps> = ({
  listDetail,
  status,
  error,
}) => {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const user = session?.user;

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

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{listDetail.name}</h1>
          {listDetail.is_public ? (
            <Globe size={20} className="text-green-500" />
          ) : (
            <Lock size={20} className="text-orange-500" />
          )}
        </div>
        <p className="text-muted-foreground">{listDetail.description}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-3">
          {listDetail.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-3">
          <span>
            <Eye size={14} className="inline mr-1" /> {listDetail.views} views
          </span>
          <span>
            <ListChecks size={14} className="inline mr-1" />{" "}
            {listDetail.questions_count} questions
          </span>
          {/* Add Like/Dislike for the list itself if API supports and you want it */}
          {/* <Button variant="ghost" size="sm"><ThumbsUp size={14} className="mr-1"/> {listDetail.likes_count}</Button> */}
          {/* <Button variant="ghost" size="sm"><ThumbsDown size={14} className="mr-1"/> {listDetail.dislikes_count}</Button> */}
          {/* Edit button if list belongs to current user */}
          {/* <Button variant="outline" size="sm"><Edit3 size={14} className="mr-1"/> Edit List</Button> */}

          <div className="flex items-center justify-between">
            <div className="flex gap-2 mt-auto">
              <div
                className="flex p-1 rounded-md items-center gap-1 cursor-pointer hover:bg-accent"
                onClick={() => {}}
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
                onClick={() => {}}
              >
                {listDetail.is_liked ? (
                  <RiThumbDownFill size={16} />
                ) : (
                  <RiThumbDownLine size={16} />
                )}{" "}
                {listDetail.dislikes_count}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Questions in this List</h2>
        {listDetail.questions.length > 0 ? (
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
