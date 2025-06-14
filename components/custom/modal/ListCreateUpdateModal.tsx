import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createUserList, fetchUserLists, updateUserList } from "@/store/slices/userListSlice";
import { toast } from "sonner";
import { fetchMyLists, fetchPublicLists } from "@/store/slices/allListsSlice";
import { fetchListDetails } from "@/store/slices/listDetailSlice";

export function ListCreateUpdateModal({
  open,
  onOpenChange,
  type,
  initialData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "create" | "update";
  initialData?: {
    id?: string;
    name: string;
    description: string;
    is_public: boolean;
    tags: string[];
    views?: number;
  };
}) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [isPublic, setIsPublic] = useState(type!= "create" ? initialData?.is_public ?? false : false);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [views] = useState(initialData?.views ?? 0);

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setIsPublic(initialData.is_public ?? true);
      setTags(initialData.tags || []);
    }
  }, [open, initialData]);

  function resetValues() {
    setName("");
    setDescription("");
    setIsPublic(true);
    setTags([]);
    setTagInput("");
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    // console.log("submit called");
    e.preventDefault();
    if (type === "create") {
      dispatch(
        createUserList({
          name,
          description,
          is_public: isPublic,
          tags,
        })
      );
      toast.success("List created successfully!");
    } else if (type === "update" && initialData?.id) {
      dispatch(
        updateUserList({
          id: initialData.id,
          name,
          description,
          is_public: isPublic,
          tags,
          views,
        })
      );
      toast.success("List updated successfully!");

      dispatch(fetchListDetails(initialData.id));
    }

    resetValues();
    // refetch lists after create/update
    dispatch(fetchMyLists({ skip: 0, limit: 20 }));
    dispatch(fetchPublicLists({ skip: 0, limit: 20 }));
    dispatch(fetchUserLists());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {type === "update" ? "Update List" : "Create List"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name">Title</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex flex-wrap items-center gap-2 border rounded px-2 py-1 min-h-[40px] bg-background">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      className="ml-1 text-primary hover:text-red-500"
                      onClick={() => removeTag(tag)}
                      tabIndex={-1}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="tags"
                  name="tags"
                  className="flex-1 outline-none bg-transparent min-w-[80px] py-1"
                  placeholder={tags.length === 0 ? "Type and press Enter" : ""}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public">Public</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSubmit}>
              {type === "update" ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
