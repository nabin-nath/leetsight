// src/app/lists/page.tsx
"use client";
import { ListDetailView } from "@/components/custom/lists/ListDetailView";
import { ListSidebar } from "@/components/custom/lists/ListSidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyLists, fetchPublicLists } from "@/store/slices/allListsSlice";
import {
  clearSelectedList,
  fetchListDetails,
} from "@/store/slices/listDetailSlice";
import { LayoutGrid } from "lucide-react"; // Icons for toggle
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ListsPage() {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const [activeListType, setActiveListType] = useState<"public" | "my">(
    "public"
  );
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { myLists, publicLists } = useAppSelector((state) => state.allLists);
  const {
    selectedListDetail,
    status: listDetailStatus,
    error: listDetailError,
  } = useAppSelector((state) => state.listDetail);

  const listsToDisplay = activeListType === "my" ? myLists : publicLists;

  // Fetch initial lists based on active type
  useEffect(() => {
    const fetchInitialData = (type: "public" | "my") => {
      const currentListState = type === "my" ? myLists : publicLists;
      if (currentListState.status === "idle") {
        if (type === "my" && session) {
          // Only fetch my lists if logged in
          console.log("Fetching my lists for user:", session.user?.email);
          dispatch(fetchMyLists({ skip: 0, limit: 20, searchTerm }));
        } else if (type === "public") {
          console.log("Fetching public lists with search term:", searchTerm);
          dispatch(fetchPublicLists({ skip: 0, limit: 20, searchTerm }));
        }
      }
    };
    fetchInitialData(activeListType);
  }, [
    activeListType,
    dispatch,
    myLists.status,
    publicLists.status,
    session,
    searchTerm,
  ]); // Added searchTerm

  // Fetch list details when a list is selected
  useEffect(() => {
    if (selectedListId) {
      dispatch(fetchListDetails(selectedListId));
    } else {
      dispatch(clearSelectedList()); // Clear details if no list is selected
    }
  }, [selectedListId, dispatch]);

  const handleListSelect = useCallback((listId: string) => {
    setSelectedListId(listId);
  }, []);

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      setSelectedListId(null); // Clear selected list on new search
      // Trigger refetch by changing activeListType slightly or dispatching directly with new search term
      // Forcing a refetch when search term changes:
      if (activeListType === "my" && session) {
        dispatch(fetchMyLists({ skip: 0, limit: 20, searchTerm: term }));
      } else if (activeListType === "public") {
        dispatch(fetchPublicLists({ skip: 0, limit: 20, searchTerm: term }));
      }
    },
    [activeListType, dispatch, session]
  );

  const handleToggleListType = (type: "public" | "my") => {
    if (type === "my" && !session) {
      // Redirect to login or show message
      toast.error("Please login to view your lists.");
      return;
    }
    setActiveListType(type);
    setSelectedListId(null); // Clear selected list when toggling type
    setSearchTerm(""); // Clear search term
  };

  // Responsive: On small screens, maybe only show sidebar or detail, not both.
  // This example uses a simple CSS-driven approach for larger screens.
  // For true responsive toggle, you'd use JS to manage visibility.
  const showDetailView = selectedListId || listDetailStatus === "loading";

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-var(--header-height,65px))]">
      {" "}
      {/* Adjust for your header height */}
      <ListSidebar
        activeListType={activeListType}
        onToggleListType={handleToggleListType}
        lists={listsToDisplay.items}
        status={listsToDisplay.status}
        error={listsToDisplay.error}
        selectedListId={selectedListId}
        onListSelect={handleListSelect}
        onSearch={handleSearch}
        // Pass pagination handlers if implementing infinite scroll/load more for sidebar
      />
      <main
        className={`flex-1 overflow-auto p-4 md:p-6 transition-all duration-300 ease-in-out ${
          showDetailView ? "block" : "hidden md:block" // Show detail on mobile if selected
        }`}
      >
        {selectedListId ? (
          <ListDetailView
            listDetail={selectedListDetail}
            status={listDetailStatus}
            error={listDetailError}
            // Add other necessary props like handlers for question actions
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <LayoutGrid size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Select a list to view its questions.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeListType === "public"
                ? "Browsing public lists."
                : "Browsing your lists."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
