// src/app/page.tsx
"use client";
import { ApplyFiltersCard } from "@/components/custom/applyFilters";
import PrimaryPostCard from "@/components/custom/card/PrimarPostCard"; // Adjust the import path as needed
import { PaginationDemo } from "@/components/custom/PaginationFilter";
import { addDays, format as formatDateFns, isValid, parseISO } from "date-fns"; // Ensure alias for format
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Suspense, useCallback, useEffect, useState } from "react"; // useState for local UI state if any

// Redux imports
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCompanies } from "@/store/slices/companiesSlice";
import { fetchPosts, setFiltersOptimistic } from "@/store/slices/postsSlice";
import {
  fetchRolesForCompany,
  setRolesForCompany,
} from "@/store/slices/rolesSlice";
import { fetchUserLists } from "@/store/slices/userListSlice";
import { Filters as ReduxFiltersState } from "@/types"; // Use Filters from types
import { useSession } from "next-auth/react";

// Keep local helper functions like formatDateDisplay, parseDateParam
// ... (parseDateParam, formatDateDisplay can remain the same) ...
const parseDateParam = (
  dateStr: string | null | undefined,
  defaultDate: Date // Return Date object for UI components
): Date => {
  if (!dateStr) return defaultDate;
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? date : defaultDate;
  } catch (e) {
    console.error("Failed to parse date string:", dateStr, e);
    return defaultDate;
  }
};

const formatDateDisplay = (dateString?: string | null) => {
  if (!dateString) return "Date N/A";
  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) {
      const isoDateObj = parseISO(dateString);
      if (isValid(isoDateObj)) {
        return formatDateFns(isoDateObj, "MMM dd, yyyy");
      }
      return dateString;
    }
    return formatDateFns(dateObj, "MMM dd, yyyy");
  } catch (e) {
    console.error("Unable to parse dateString: ", dateString, e);
    return dateString;
  }
};

// No QueryClient needed here anymore if all data is in Redux
export default function HomeWrapper() {
  // If StoreProvider is in a higher layout, this might just return <Home />
  // Suspense can still be used for code splitting Home if it's heavy
  return (
    <Suspense
      fallback={
        <div className="mx-auto my-auto flex justify-center items-center">
          Loading Page...
        </div>
      }
    >
      <Home />
    </Suspense>
  );
}

interface LocalFiltersUIState {
  // For ApplyFiltersCard props if it still expects Date objects
  companyId: string;
  role: string;
  pageSize: string; // Keep as string for form compatibility
  fromDate?: Date;
  toDate?: Date;
}

function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const userListStatus = useAppSelector((state) => state.userList.status);
  const { data: session, status: authStatus } = useSession();

  // --- Selectors for Redux State ---
  const {
    items: availableCompanies,
    status: companiesStatus,
    error: companiesError,
  } = useAppSelector((state) => state.companies);
  const rolesByCompany = useAppSelector((state) => state.roles); // This is an object: { [companyId]: { roles, status, error } }
  const {
    items: posts,
    status: postsStatus,
    error: postsError,
    currentPage: postsCurrentPageRedux, // From API response
    totalPages: postsTotalPages,
    currentFilters: reduxCurrentFilters,
  } = useAppSelector((state) => state.posts);

  useEffect(() => {
    console.log("inside use effect to fetch user lists");
    // Fetch user lists if the user is authenticated and lists haven't been fetched yet
    if (authStatus === "authenticated" && userListStatus === "idle") {
      console.log("Fetching user lists for authenticated user");
      dispatch(fetchUserLists());
    }
  }, [authStatus, userListStatus, dispatch]);

  // Local state in Home to track the company ID currently selected in ApplyFiltersCard
  // for the purpose of fetching/displaying its roles.
  // Initialize it from the applied filters or URL params.
  const [companyIdForRolePreview, setCompanyIdForRolePreview] =
    useState<string>(() => {
      const params = new URLSearchParams(searchParams);
      return (
        params.get("companyId") || reduxCurrentFilters?.companyId || "1000"
      );
    });

  // --- Local state for URL parsing and driving Redux filter state ---
  // This local state translates URL params into a structure that can be dispatched
  // to update Redux `currentFilters` in the postsSlice.
  const [derivedFiltersFromUrl, setDerivedFiltersFromUrl] =
    useState<ReduxFiltersState>(() => {
      const params = new URLSearchParams(searchParams);
      const defaultFromDate = addDays(new Date(), -60);
      const defaultToDate = new Date();
      const page = parseInt(params.get("page") || "1", 10);

      return {
        companyId: params.get("companyId") || "1000",
        role: params.get("role") || "All Roles",
        pageSize: parseInt(params.get("pageSize") || "10", 10),
        fromDate: params.get("fromDate")
          ? params.get("fromDate")!
          : formatDateFns(defaultFromDate, "yyyy-MM-dd"),
        toDate: params.get("toDate")
          ? params.get("toDate")!
          : formatDateFns(defaultToDate, "yyyy-MM-dd"),
        page: isNaN(page) || page < 1 ? 1 : page,
      };
    });

  // --- Derived state for ApplyFiltersCard UI ---
  // `initialFilters` for ApplyFiltersCard should now use `companyIdForRolePreview` for its companyId
  // but other fields from the actual applied filters (reduxCurrentFilters or derivedFiltersFromUrl).
  const activeUIFilters: LocalFiltersUIState = React.useMemo(() => {
    const baseFilters = reduxCurrentFilters || derivedFiltersFromUrl;
    return {
      companyId: companyIdForRolePreview,
      role:
        companyIdForRolePreview === baseFilters.companyId
          ? baseFilters.role || "All Roles"
          : "All Roles", // Reset role if preview company differs
      pageSize: String(baseFilters.pageSize),
      fromDate: baseFilters.fromDate
        ? parseISO(baseFilters.fromDate)
        : undefined,
      toDate: baseFilters.toDate ? parseISO(baseFilters.toDate) : undefined,
    };
  }, [companyIdForRolePreview, reduxCurrentFilters, derivedFiltersFromUrl]);

  // --- Derived roles for the selected company ---
  const selectedCompanyIdForRoles =
    reduxCurrentFilters?.companyId || derivedFiltersFromUrl.companyId || "1000";
  const currentCompanyRolesData = rolesByCompany[companyIdForRolePreview] || {
    roles: ["All Roles"],
    status: "idle",
    error: null,
  };
  // console.log(
  //   "current selected company: ",
  //   selectedCompanyIdForRoles,
  //   currentCompanyRolesData
  // );
  const availableRolesForFilter = currentCompanyRolesData.roles;
  // console.log("Available roles for filter:", availableRolesForFilter);
  const isLoadingRoles = currentCompanyRolesData.status === "loading";

  // --- Effect to fetch initial data ---
  useEffect(() => {
    if (companiesStatus === "idle") {
      dispatch(fetchCompanies());
    }
  }, [companiesStatus, dispatch]);

  // Effect to fetch roles when selected company changes in Redux filters (or initially)
  useEffect(() => {
    if (companyIdForRolePreview && companiesStatus === "succeeded") {
      const companyData = rolesByCompany[companyIdForRolePreview];
      if (companyIdForRolePreview === "1000") {
        if (
          !companyData ||
          companyData.status !== "succeeded" ||
          companyData.roles[0] !== "All Roles"
        ) {
          dispatch(
            setRolesForCompany({
              companyId: "1000",
              data: { roles: ["All Roles"], status: "succeeded", error: null },
            })
          );
        }
      } else if (
        !companyData ||
        companyData.status === "idle" ||
        companyData.status === "failed"
      ) {
        dispatch(fetchRolesForCompany(companyIdForRolePreview));
      }
    }
  }, [companyIdForRolePreview, companiesStatus, rolesByCompany, dispatch]);

  // Effect to fetch posts when filters in Redux (currentFilters) or page changes
  useEffect(() => {
    const filtersToFetch: ReduxFiltersState = derivedFiltersFromUrl;
    if (filtersToFetch.pageSize > 0 && postsStatus !== "loading") {
      let shouldFetch = true;
      if (postsStatus === "succeeded" && reduxCurrentFilters) {
        const { page: _p1, ...rf } = reduxCurrentFilters; // Applied filters in store
        const { page: _p2, ...ff } = filtersToFetch; // Filters we want to fetch for
        if (
          JSON.stringify(rf) === JSON.stringify(ff) &&
          reduxCurrentFilters.page === filtersToFetch.page
        ) {
          shouldFetch = false;
        }
      }
      if (shouldFetch || postsStatus === "idle" || postsStatus === "failed") {
        dispatch(fetchPosts(filtersToFetch));
      }
    }
  }, [derivedFiltersFromUrl, postsStatus, reduxCurrentFilters, dispatch]);

  // --- Handlers ---
  const handlePageChange = useCallback(
    (newPage: number) => {
      setDerivedFiltersFromUrl((prev) => ({ ...prev, page: newPage }));
      // Update URL
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set("page", String(newPage));
      router.push(`/?${currentParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleFiltersChangeFromSidebar = useCallback(
    (newUiFilters: LocalFiltersUIState) => {
      const newAppliedFiltersPayload: Omit<ReduxFiltersState, "page"> = {
        companyId: newUiFilters.companyId, // This companyId IS the one to apply
        role: newUiFilters.role,
        pageSize: parseInt(newUiFilters.pageSize, 10),
        fromDate: newUiFilters.fromDate
          ? formatDateFns(newUiFilters.fromDate, "yyyy-MM-dd")
          : undefined,
        toDate: newUiFilters.toDate
          ? formatDateFns(newUiFilters.toDate, "yyyy-MM-dd")
          : undefined,
      };
      dispatch(setFiltersOptimistic(newAppliedFiltersPayload)); // This updates reduxCurrentFilters

      // Sync derivedFiltersFromUrl to trigger post fetch and reflect applied state
      setDerivedFiltersFromUrl((prev) => ({
        ...prev,
        ...newAppliedFiltersPayload,
        page: 1,
      }));

      // Also, sync the companyIdForRolePreview to the applied companyId
      setCompanyIdForRolePreview(newUiFilters.companyId);

      // Update URL
      const newParams = new URLSearchParams();
      // ... (param setting as before, using newAppliedFiltersPayload)
      newParams.set("page", "1");
      newParams.set("pageSize", String(newAppliedFiltersPayload.pageSize));
      if (
        newAppliedFiltersPayload.companyId &&
        newAppliedFiltersPayload.companyId !== "1000"
      )
        newParams.set("companyId", newAppliedFiltersPayload.companyId);
      if (
        newAppliedFiltersPayload.role &&
        newAppliedFiltersPayload.role !== "All Roles"
      )
        newParams.set("role", newAppliedFiltersPayload.role);
      if (newAppliedFiltersPayload.fromDate)
        newParams.set("fromDate", newAppliedFiltersPayload.fromDate);
      if (newAppliedFiltersPayload.toDate)
        newParams.set("toDate", newAppliedFiltersPayload.toDate);
      router.push(`/?${newParams.toString()}`, { scroll: false });
    },
    [dispatch, router]
  );

  const handleCompanySelectedForRoleFetch = useCallback((companyId: string) => {
    setCompanyIdForRolePreview(companyId);
  }, []);

  const isInitialLoad =
    companiesStatus === "loading" ||
    (postsStatus === "loading" && posts.length === 0);
  const overallError =
    companiesError || postsError || currentCompanyRolesData.error;

  return (
    <div className="">
      <div className="flex flex-col w-full rounded-lg p-4 md:p-6 shadow-xl md:h-[calc(100vh-65px)] overflow-hidden">
        <div className="mb-4">
          <p className="mt-1 text-muted-foreground">
            Browse the latest technical interview experiences from top
            companies.
          </p>
          {companiesStatus === "succeeded" && ( // Only render ApplyFiltersCard if companies are loaded
            <ApplyFiltersCard
              availableCompanies={availableCompanies}
              availableRoles={availableRolesForFilter} // Use derived roles
              initialFilters={activeUIFilters} // Pass UI-formatted filters
              isLoadingRoles={isLoadingRoles}
              onCompanySelectedForRoleFetch={handleCompanySelectedForRoleFetch}
              onFiltersChange={handleFiltersChangeFromSidebar}
            />
          )}
          {companiesStatus === "loading" && <p>Loading filters...</p>}
        </div>

        {isInitialLoad && (
          <div className="flex justify-center items-center flex-grow">
            <p>Loading data...</p>
          </div>
        )}
        {!isInitialLoad && overallError && (
          <div className="text-red-500 p-4 bg-red-50 rounded-md flex-grow">
            Error loading data: {overallError}
          </div>
        )}
        {!isInitialLoad &&
          !overallError &&
          posts.length === 0 &&
          postsStatus === "succeeded" && (
            <div className="text-center py-10 flex-grow text-muted-foreground">
              No questions found for the selected filters.
            </div>
          )}

        {posts.length > 0 && (
          <>
            {postsStatus === "loading" &&
              posts.length > 0 && ( // Show "Updating list..." if loading new page/filters but old data exists
                <div className="text-center text-sm text-muted-foreground mb-2">
                  Updating list...
                </div>
              )}
            <div className="space-y-5 overflow-y-auto pr-2 pb-4 flex-grow">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <PrimaryPostCard
                    key={post.topic_id}
                    title={post.title}
                    topic_id={post.topic_id}
                    companies={post.companies}
                    leetcode_created_at={formatDateDisplay(
                      post.leetcode_created_at
                    )}
                    yoe={post.yoe}
                    views={post.views}
                    tags={post.tags}
                    roles={post.roles}
                    questions_extracted={post.questions_extracted}
                    likes_count={post.likes_count}
                    dislikes_count={post.dislikes_count}
                    is_liked={post.is_liked}
                    is_disliked={post.is_disliked}
                  />
                ))}
              </div>
            </div>
            {postsTotalPages > 1 && (
              <div className="mt-auto pt-4 border-t bg-background z-10 flex-shrink-0">
                <PaginationDemo
                  count={postsTotalPages}
                  initialPage={derivedFiltersFromUrl.page} // Use page from URL/derived state
                  onChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
