"use client";
import { ListDetailView } from "@/components/custom/lists/ListDetailView";
import { ListSidebar } from "@/components/custom/lists/ListSidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyLists, fetchPublicLists } from "@/store/slices/allListsSlice";
import {
  clearSelectedList,
  fetchListDetails,
} from "@/store/slices/listDetailSlice";
import { LayoutGrid } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ListsPage() {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to access URL query parameters
  const lastFetchedListIdRef = useRef<string | null>(null);
  const selectedListIdFromUrl = searchParams.get("id"); // Get 'id' from ?id=...

  const [activeListType, setActiveListType] = useState<"public" | "my">(
    "public"
  );
  const [searchTerm, setSearchTerm] = useState(""); // For sidebar search

  const { myLists, publicLists } = useAppSelector((state) => state.allLists);
  const {
    selectedListDetail,
    status: listDetailStatus,
    error: listDetailError,
  } = useAppSelector((state) => state.listDetail);

  const listsToDisplay = activeListType === "my" ? myLists : publicLists;
  const lastDispatchedFetchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeListType === "my") {
      if (session && myLists.status === "idle") {
        dispatch(fetchMyLists({ skip: 0, limit: 20 }));
      }
    } else {
      // public
      if (publicLists.status === "idle") {
        dispatch(fetchPublicLists({ skip: 0, limit: 20 }));
      }
    }
  }, [
    activeListType,
    dispatch,
    myLists.status,
    publicLists.status,
    session,
    searchTerm,
  ]);

  // Fetch list details when selectedListIdFromUrl changes
  useEffect(() => {
    if (selectedListIdFromUrl) {
      // Should we attempt to fetch?
      let shouldDispatchFetch = false;

      if (listDetailStatus === "loading") {
        // If loading, only update our ref if the loading is for the current URL ID.
        // This prevents a new dispatch if user navigates while another ID is loading.
        if (lastDispatchedFetchIdRef.current !== selectedListIdFromUrl) {
          // This case means URL changed while a *different* list was loading.
          // We might want to cancel the previous or let it finish, then fetch new.
          // For now, we just note that we *would* want to fetch the new one once current loading stops.
          // This logic could be more complex if cancellation is needed.
        }
      } else if (selectedListIdFromUrl !== lastDispatchedFetchIdRef.current) {
        // Case 1: The ID in the URL is different from the one we last dispatched a fetch for.
        // This means user navigated to a new list, or it's the first load with this ID.
        // We should also check if the data in store is already for this new ID and succeeded.
        if (
          selectedListDetail?.id !== selectedListIdFromUrl ||
          listDetailStatus !== "succeeded"
        ) {
          shouldDispatchFetch = true;
        } else {
          lastDispatchedFetchIdRef.current = selectedListIdFromUrl; // Align ref with current URL ID as data is present
        }
      } else if (
        listDetailStatus === "failed" &&
        selectedListIdFromUrl === lastDispatchedFetchIdRef.current
      ) {
        // Case 2: Last dispatch for this SAME ID failed.
        // We DO NOT automatically re-dispatch here to prevent loops.
        // A user action (e.g., retry button) should trigger a re-fetch.
      } else if (
        listDetailStatus === "idle" &&
        selectedListIdFromUrl !== lastDispatchedFetchIdRef.current
      ) {
        // Case 3: Status is idle (e.g. after clearSelectedList) and the ID is new compared to last dispatch
        // This is largely covered by Case 1, but explicit 'idle' check can be a fallback.
        shouldDispatchFetch = true;
      }

      if (shouldDispatchFetch) {
        dispatch(fetchListDetails(selectedListIdFromUrl));
        lastDispatchedFetchIdRef.current = selectedListIdFromUrl; // Record that we are dispatching for this ID.
      }
    } else {
      // No selectedListIdFromUrl in the URL
      if (selectedListDetail && listDetailStatus !== "idle") {
        dispatch(clearSelectedList());
        lastDispatchedFetchIdRef.current = null; // Reset when selection is cleared
      } else {
        // console.log(
        //   "[ListDetailEffect] No URL ID and no detail to clear or already idle."
        // );
      }
    }
  }, [
    selectedListIdFromUrl,
    dispatch,
    listDetailStatus,
    selectedListDetail?.id,
  ]);

  // Handler for when a list is selected in the sidebar
  const handleListSelect = useCallback(
    (listId: string) => {
      // --- MODIFICATION: Update URL instead of local state ---
      // Preserve other query params like 'type' or 'search' if they exist and are relevant
      const currentQuery = new URLSearchParams(
        Array.from(searchParams.entries())
      );
      currentQuery.set("id", listId);
      router.push(`/lists?${currentQuery.toString()}`);
      // The useEffect watching `selectedListIdFromUrl` will then fetch details.
    },
    [router, searchParams]
  );

  // Handler for sidebar search input
  const handleSearch = useCallback(
    (newSearchTerm: string) => {
      setSearchTerm(newSearchTerm);
      // When searching, clear the selected list ID from the URL
      // to show the placeholder and fetch new filtered list of lists.
      const currentQuery = new URLSearchParams(
        Array.from(searchParams.entries())
      );
      currentQuery.delete("id"); // Remove selected list ID
      // You might want to keep or reset the search term in the URL as well
      // currentQuery.set("q", newSearchTerm); // Example
      router.push(`/lists?${currentQuery.toString()}`);

      // The useEffect for fetching sidebar lists will trigger due to searchTerm change
    },
    [router, searchParams]
  );

  const handleToggleListType = (type: "public" | "my") => {
    if (type === "my" && !session) {
      toast.error("Please login to view your lists.");
      return;
    }
    setActiveListType(type);
    setSearchTerm(""); // Clear search term when toggling type

    const currentQuery = new URLSearchParams(
      Array.from(searchParams.entries())
    );
    currentQuery.delete("id");
    currentQuery.delete("q"); // Assuming 'q' is your search query param if you add it
    router.push(`/lists?${currentQuery.toString()}`);
  };

  const showDetailView =
    !!selectedListIdFromUrl || listDetailStatus === "loading";

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-var(--header-height,65px))]">
      <ListSidebar
        activeListType={activeListType}
        onToggleListType={handleToggleListType}
        lists={listsToDisplay.items}
        status={listsToDisplay.status}
        error={listsToDisplay.error}
        selectedListId={selectedListIdFromUrl} // Pass derived ID
        onListSelect={handleListSelect}
        onSearch={handleSearch}
      />
      <main
        className={`flex-1 overflow-auto mb-3  px-6 md:px-6 transition-all duration-300 ease-in-out pt-0 ${
          showDetailView ? "block" : "hidden md:block"
        }`}
      >
        {selectedListIdFromUrl ? ( // Check if there's an ID in the URL
          <ListDetailView
            listDetail={selectedListDetail} // This will be null initially if ID just changed
            status={listDetailStatus}
            error={listDetailError}
            type={activeListType}
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
