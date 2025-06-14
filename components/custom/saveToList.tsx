"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUserLists } from "@/store/slices/userListSlice"; // From your user list setup
import { CheckCircle, Globe, ListPlus, Lock } from "lucide-react"; // Icons
import React, { useEffect } from "react";

interface SaveToListModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  // This function will now dispatch the `updateQuestionInList` thunk with 'add'
  onQuestionListUpdate: (
    listId: string,
    questionId: string,
    action: "add" | "remove"
  ) => Promise<boolean>;
  // To show loading state or "Added" state
  // This would ideally be an object: { [listId: string]: 'saving' | 'removing' | 'added' | 'failed' }
  listInteractionStatus: {
    [listId: string]: "saving" | "removing" | "added" | "failed" | "idle";
  };
  // We need to know which lists already contain this question
  listsContainingQuestion: string[]; // Array of list IDs
}

export const SaveToListModal: React.FC<SaveToListModalProps> = ({
  isOpen,
  onOpenChange,
  questionId,
  onQuestionListUpdate,
  listInteractionStatus,
  listsContainingQuestion,
}) => {
  const dispatch = useAppDispatch();
  const {
    lists: userLists,
    status: userListsStatus,
    error: userListsError,
  } = useAppSelector((state) => state.userList); // Assuming userListSlice is named 'userLists' in store

  useEffect(() => {
    if (isOpen && userListsStatus === "idle") {
      dispatch(fetchUserLists());
    }
  }, [isOpen, userListsStatus, dispatch]);

  const handleListAction = async (listId: string) => {
    const isAlreadyInList = listsContainingQuestion.includes(listId);
    const actionToPerform = isAlreadyInList ? "remove" : "add";

    const success = await onQuestionListUpdate(
      listId,
      questionId,
      actionToPerform
    );

    if (success && actionToPerform === "add") {
      // onOpenChange(false); // Optionally close modal after adding
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-3">
        <DialogHeader>
          <DialogTitle>Save Question to List</DialogTitle>
          <DialogDescription>
            Select a list to add this question to.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[300px] w-full p-1">
          {" "}
          {/* Added padding to ScrollArea */}
          {userListsStatus === "loading" && <p>Loading lists...</p>}
          {userListsStatus === "failed" && (
            <p className="text-destructive">Error: {userListsError}</p>
          )}
          {userListsStatus === "succeeded" && userLists.length === 0 && (
            <p className="text-muted-foreground">
              You have no lists. Create one first!
            </p>
          )}
          {userListsStatus === "succeeded" && userLists.length > 0 && (
            <div className="space-y-2 py-2">
              {userLists.map((list) => {
                const interactionState =
                  listInteractionStatus[list.id] || "idle";
                const isQuestionInThisList = listsContainingQuestion.includes(
                  list.id
                );
                let buttonText = isQuestionInThisList
                  ? "Remove from List"
                  : "Add to List";
                if (interactionState === "saving") buttonText = "Adding...";
                if (interactionState === "removing") buttonText = "Removing...";
                if (interactionState === "added" && !isQuestionInThisList)
                  buttonText = "Added!"; // If optimistic update worked

                return (
                  <Button
                    key={list.id}
                    variant={"outline"} // Example styling
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => handleListAction(list.id)}
                    disabled={
                      interactionState === "saving" ||
                      interactionState === "removing"
                    }
                  >
                    <div className="flex items-center space-x-2 w-full">
                      {list.is_public ? (
                        <Globe size={16} />
                      ) : (
                        <Lock size={16} />
                      )}
                      <div className="flex-grow">
                        <p className="font-semibold">{list.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {list.description.length > 65 ? `${list.description.slice(0, 65)}...` : list.description} ({list.questions_count} Qs)
                        </p>
                      </div>
                      {/* Visual feedback for interaction state */}
                      {interactionState === "saving" && (
                        <ListPlus size={16} className="animate-spin" />
                      )}
                      {interactionState === "removing" && (
                        <ListPlus size={16} className="animate-spin" />
                      )}
                      {isQuestionInThisList && (
                        <CheckCircle size={16} className="text-green-500" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
