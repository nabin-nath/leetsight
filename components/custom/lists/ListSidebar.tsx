// src/components/custom/lists/ListSidebar.tsx
"use client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserListItem } from "@/types";
import { Globe, PlusCircle, User } from "lucide-react"; // Example icons
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import { ListCreateUpdateModal } from "../modal/ListCreateUpdateModal";

interface ListSidebarProps {
  activeListType: "public" | "my";
  onToggleListType: (type: "public" | "my") => void;
  lists: UserListItem[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  selectedListId: string | null;
  onListSelect: (listId: string) => void;
  onSearch: (searchTerm: string) => void;
  // onPaginate?: () => void; // For "load more"
}

const ListItemCard: React.FC<{
  list: UserListItem;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ list, isSelected, onSelect }) => (
  <Button
    variant={isSelected ? "secondary" : "ghost"}
    className="border w-full h-auto justify-start text-left p-3 flex flex-col items-start space-y-1 mb-3"
    onClick={onSelect}
  >
    <div className="flex items-center justify-between w-full">
      <span className="font-semibold text-sm truncate">{list.name}</span>
      {list.is_public ? (
        <Globe size={14} className="flex-shrink-0" />
      ) : (
        <User size={14} className="flex-shrink-0" />
      )}
    </div>
    <p className="text-xs text-wrap text-muted-foreground overflow-auto line-clamp-2">
      {list.description.length > 100
        ? `${list.description.slice(0, 100)}...`
        : list.description}
    </p>
    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
      <span>{list.questions_count} Qs</span>
      <span>•</span>
      <span>{list.views} views</span>
    </div>
  </Button>
);

export const ListSidebar: React.FC<ListSidebarProps> = ({
  activeListType,
  onToggleListType,
  lists = [],
  status,
  error,
  selectedListId,
  onListSelect,
  onSearch,
}) => {
  const [searchTermLocal, setSearchTermLocal] = useState("");
  const { data: session } = useSession();
  const user = session?.user;
  const [createOpen, setCreateOpen] = useState(false);

  const handleSearchSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    onSearch(searchTermLocal);
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 border-r bg-background flex flex-col p-4 space-y-4 overflow-y-hidden">
      {/* Toggle and Create Buttons */}
      <div className="flex items-center space-x-2">
        <Button
          variant={activeListType === "public" ? "default" : "outline"}
          size="sm"
          onClick={() => onToggleListType("public")}
          className="flex-1"
        >
          <Globe size={16} className="mr-2" /> Public
        </Button>
        <Button
          variant={activeListType === "my" ? "default" : "outline"}
          size="sm"
          onClick={() => onToggleListType("my")}
          className="flex-1"
        >
          <User size={16} className="mr-2" /> My Lists
        </Button>
      </div>
      {user && (
        <>
          <Button
            variant="outline"
            className="w-full mb-0"
            onClick={() => setCreateOpen(true)}
          >
            <PlusCircle size={16} /> Create new list
          </Button>
          <ListCreateUpdateModal
            open={createOpen}
            onOpenChange={setCreateOpen}
            type="create"
          />
        </>
      )}

      {/* Search Bar */}
      {/* <form onSubmit={handleSearchSubmit} className="flex space-x-2">
        <Input
          type="search"
          placeholder="Search lists..."
          value={searchTermLocal}
          onChange={(e) => setSearchTermLocal(e.target.value)}
          className="flex-grow"
        />
      </form> */}

      {/* Lists Area */}
      <ScrollArea className="flex-grow -mx-4 overflow-y-auto">
        {" "}
        {/* Negative margin to extend scroll to edges */}
        <div className="px-4 space-y-1">
          {status === "loading" && (
            <p className="p-4 text-center text-muted-foreground">
              Loading lists...
            </p>
          )}
          {status === "failed" && (
            <p className="p-4 text-center text-destructive">Error: {error}</p>
          )}
          {status === "succeeded" && lists.length === 0 && (
            <p className="p-4 text-center text-muted-foreground">
              No lists found.
            </p>
          )}

          {status === "succeeded" &&
            lists.map((list) => (
              <ListItemCard
                key={list.id}
                list={list}
                isSelected={selectedListId === list.id}
                onSelect={() => onListSelect(list.id)}
              />
            ))}
        </div>
      </ScrollArea>
    </aside>
  );
};
