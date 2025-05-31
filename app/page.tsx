// --- START OF FILE page.tsx ---
"use client";
import * as React from "react";
import PrimaryQuestionCard from "@/components/custom/card/question";
import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/apiClient";
import { addDays, format, parseISO, isValid } from "date-fns";
import { ApplyFiltersCard } from "@/components/custom/applyFilters";
import { PaginationDemo } from "@/components/custom/PaginationFilter";
import { useRouter, useSearchParams } from "next/navigation";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { Suspense } from "react";

interface Company {
  name: string;
  id: number;
}

interface ProcessedPost {
  topic_id: number;
  title: string;
  companies: Company[] | [];
  leetcode_created_at?: string | null;
  yoe: string;
  views?: number;
  tags: string[] | null;
  roles: string[] | [];
  questions_extracted: number;
  likes_count: number;
  dislikes_count: number;
  is_liked: boolean;
  is_disliked: boolean;
}
interface RecentPostsApiResponse {
  items: ProcessedPost[];
  total_records: number;
  current_page: number;
  total_pages: number;
}

interface FiltersState {
  companyId: string;
  role: string;
  pageSize: string;
  fromDate?: Date;
  toDate?: Date;
}

interface CompanyOption {
  name: string;
  id: string | number;
}

const parseDateParam = (
  dateStr: string | null | undefined,
  defaultDate: Date
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
    // Check if date is valid after parsing
    if (isNaN(dateObj.getTime())) {
      // Try parsing with parseISO if it failed
      const isoDateObj = parseISO(dateString);
      if (isValid(isoDateObj)) {
        return format(isoDateObj, "MMM dd, yyyy");
      }
      return dateString; // Fallback
    }
    return format(dateObj, "MMM dd, yyyy");
  } catch {
    return dateString; // Fallback
  }
};

// --- Query Client Setup ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes for posts
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export default function HomeWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        <Home />
      </Suspense>
    </QueryClientProvider>
  );
}

function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getInitialFilters = useCallback((): FiltersState => {
    const params = new URLSearchParams(searchParams);
    const defaultFromDate = addDays(new Date(), -60);
    const defaultToDate = new Date();

    return {
      companyId: params.get("companyId") || "1000",
      role: params.get("role") || "All Roles",
      pageSize: params.get("pageSize") || "10",
      fromDate: parseDateParam(params.get("fromDate"), defaultFromDate),
      toDate: parseDateParam(params.get("toDate"), defaultToDate),
    };
  }, [searchParams]);

  const getInitialPage = useCallback((): number => {
    const params = new URLSearchParams(searchParams);
    const pageParam = params.get("page");
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    return isNaN(page) || page < 1 ? 1 : page;
  }, [searchParams]);

  // Initialize state based on URL only once
  const [currentPage, setCurrentPage] = useState<number>(getInitialPage);
  const [activeFilters, setActiveFilters] =
    useState<FiltersState>(getInitialFilters);

  // --- State for Filter Options (Roles) ---
  // We still need local state for availableRoles as it depends on the *selected* company
  const [availableRoles, setAvailableRoles] = useState<string[]>(["All Roles"]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // --- Fetch Companies with useQuery ---
  const {
    data: companiesData,
    isLoading: isCompaniesLoading,
    isError: isCompaniesError,
    error: companiesError,
  } = useQuery<CompanyOption[], Error>({
    queryKey: ["companies"], // Static key
    queryFn: async () => {
      // console.log("React Query Fetching Companies...");
      const res = await apiClient.get("/companies");
      if (res.status < 200 || res.status >= 300)
        throw new Error("Failed to fetch companies");
      const data = res.data as CompanyOption[];
      // Add the "All Companies" option here as it's part of the filter dropdown
      return [{ name: "All Companies", id: "1000" }, ...data];
    },
    staleTime: Infinity, // Companies list is static/rarely changes
  });

  // Derive available companies for the dropdown from the query result
  // Use a fallback if companiesData is not yet available
  const availableCompanies = companiesData || [
    { name: "All Companies", id: "1000" },
  ];

  // --- Fetch Roles Function (Manual fetch, triggered by company selection) ---
  const fetchRolesForCompany = useCallback(
    async (companyId: string | number) => {
      if (!companyId || String(companyId) === "1000") {
        setAvailableRoles(["All Roles"]);
        return;
      }
      setIsLoadingRoles(true);
      setAvailableRoles(["Loading..."]);

      try {
        // Use the company ID in the API call
        const res = await apiClient.get(
          `/companies/${encodeURIComponent(companyId)}/roles`
        );
        if (res.status < 200 || res.status >= 300) {
          const errData = res.data;
          console.error("API Error Response for Roles:", errData); // Log full error response
          throw new Error(
            errData.error ||
              `Failed to fetch roles for company ID ${companyId} (Status: ${res.status})`
          );
        }
        const data: string[] = res.data;
        setAvailableRoles([
          "All Roles",
          ...data.filter((role) => role && role !== "N/A").sort(), // Ensure role is not null/empty
        ]);
      } catch (err) {
        console.error(`Error fetching roles for company ID ${companyId}:`, err);
        // Reset roles on error to avoid showing stale roles for the wrong company
        setAvailableRoles(["All Roles"]);
      } finally {
        setIsLoadingRoles(false);
      }
    },
    []
  ); // Dependencies: apiClient assumed stable

  useEffect(() => {
    const currentCompanyId = activeFilters.companyId;
    // Fetch roles only if companies data is loaded and a specific company is selected
    // AND the currentCompanyId is actually different from the previous one
    // (though dependency array handles this, explicit check can clarify).
    if (companiesData && currentCompanyId && currentCompanyId !== "1000") {
      // Ensure the selected company ID actually exists in the loaded companies list
      const companyExists = companiesData.some(
        (c) => String(c.id) === currentCompanyId
      );

      if (companyExists) {
        // console.log(
        //   "Company filter changed to ID:",
        //   currentCompanyId,
        //   "fetching roles..."
        // );
        // Call fetchRolesForCompany with the ID
        fetchRolesForCompany(currentCompanyId);
      } else {
        // If companyId from URL doesn't match available companies (e.g., invalid ID)
        console.warn(
          `Company ID "${currentCompanyId}" from URL not found in available companies. Resetting filter.`
        );
        // Reset to default, this state update will trigger a re-render and re-evaluate this effect
        // But the effect should NOT re-run if activeFilters.companyId becomes "1000".
        setActiveFilters((prev) => ({
          ...prev,
          companyId: "1000",
          role: "All Roles",
        }));
      }
    } else if (companiesData && activeFilters.companyId === "1000") {
      // If "All Companies" is selected, reset roles if they are not already "All Roles"
      // This check is important and uses availableRoles, but setting availableRoles
      // *doesn't* trigger the effect thanks to removing it from deps.
      if (!(availableRoles.length === 1 && availableRoles[0] === "All Roles")) {
        // console.log(
        //   "Company filter set to 'All Companies', resetting roles state."
        // );
        setAvailableRoles(["All Roles"]);
      }
    }
  }, [
    companiesData,
    activeFilters.companyId,
    fetchRolesForCompany,
    setActiveFilters,
  ]);

  const {
    data: postData,
    isLoading: isPostsLoading,
    isError: isPostsError,
    error: postsError,
    isFetching: isPostsFetching,
    isPlaceholderData: isPostsPlaceholderData,
  } = useQuery<RecentPostsApiResponse, Error>({
    queryKey: ["posts", { ...activeFilters, page: currentPage }],
    queryFn: async ({ queryKey }) => {
      const [, { page, companyId, role, pageSize, fromDate, toDate }] =
        queryKey as [string, FiltersState & { page: number }];

      const limit = parseInt(pageSize, 10);
      if (isNaN(limit) || limit <= 0) {
        console.error("Invalid pageSize from state:", pageSize);
        throw new Error("Invalid page size.");
      }

      let url = `/posts?skip=${(page - 1) * limit}&limit=${limit}`;

      if (companyId && companyId !== "1000")
        url += `&company_id=${encodeURIComponent(companyId)}`;

      if (role && role !== "All Roles")
        url += `&role=${encodeURIComponent(role)}`;

      if (fromDate) {
        url += `&start_date=${format(fromDate, "yyyy-MM-dd")}`;
      }
      if (toDate) {
        url += `&end_date=${format(toDate, "yyyy-MM-dd")}`;
      }

      // console.log("React Query Fetching Posts:", url);
      const res = await apiClient.get(url);
      if (res.status < 200 || res.status >= 300) {
        const errData = res.data;
        throw new Error(errData.error || `Failed to fetch posts`);
      }
      return res.data as RecentPostsApiResponse;
    },
  });

  const posts = postData?.items || [];
  const totalPages = postData?.total_pages || 1;

  const handlePageChange = useCallback(
    (page: number) => {
      // Update page state (this changes the query key for posts query)
      setCurrentPage(page);

      // Update URL search parameters
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set("page", page.toString());

      router.push(`/?${currentParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Handle applying filters from the sidebar
  const handleFiltersChangeFromSidebar = useCallback(
    (newFiltersFromSidebar: FiltersState) => {
      // Update filter state (this changes the query key for posts query)
      setActiveFilters(newFiltersFromSidebar);
      setCurrentPage(1); // Always reset to page 1 when filters change

      // Construct new URL search parameters from the new filters
      const newParams = new URLSearchParams();
      newParams.set("page", "1"); // Set page to 1
      newParams.set("pageSize", newFiltersFromSidebar.pageSize);

      if (
        newFiltersFromSidebar.companyId &&
        newFiltersFromSidebar.companyId !== "1000"
      ) {
        newParams.set("companyId", newFiltersFromSidebar.companyId);
      }
      if (
        newFiltersFromSidebar.role &&
        newFiltersFromSidebar.role !== "All Roles"
      ) {
        newParams.set("role", newFiltersFromSidebar.role);
      }
      if (newFiltersFromSidebar.fromDate) {
        newParams.set(
          "fromDate",
          format(newFiltersFromSidebar.fromDate, "yyyy-MM-dd")
        );
      }
      if (newFiltersFromSidebar.toDate) {
        newParams.set(
          "toDate",
          format(newFiltersFromSidebar.toDate, "yyyy-MM-dd")
        );
      }

      router.push(`/?${newParams.toString()}`, { scroll: false });
    },
    [router]
  );

  // Called by ApplyFiltersCard when the company select value changes
  const handleCompanySelectedForRoleFetch = useCallback(
    // Receives company ID string
    async (companyId: string) => {
      // console.log("Company ID selected for role fetch:", companyId);
      fetchRolesForCompany(companyId); // Call with ID
    },
    [fetchRolesForCompany]
  );

  // Determine overall loading state for the UI
  const isInitialLoad =
    isCompaniesLoading ||
    (isPostsLoading && !isPostsPlaceholderData && !postData);

  return (
    <div className="">
      <div className="flex flex-col w-full rounded-lg p-4 md:p-6 shadow-xl md:h-[calc(100vh-65px)] overflow-hidden">
        <div className="mb-4">
          <p className="mt-1 text-muted-foreground">
            Browse the latest technical interview experiences from top
            companies.
          </p>

          <ApplyFiltersCard
            availableCompanies={availableCompanies} // Data from useQuery
            availableRoles={availableRoles} // Data from useState
            initialFilters={activeFilters}
            isLoadingRoles={isLoadingRoles}
            onCompanySelectedForRoleFetch={handleCompanySelectedForRoleFetch}
            onFiltersChange={handleFiltersChangeFromSidebar}
          />
        </div>

        {/* Question List & Loading/Error States */}
        {isInitialLoad && (
          <div className="flex justify-center items-center flex-grow">
            <p>Loading data...</p>
          </div>
        )}
        {!isInitialLoad &&
          (isCompaniesError || isPostsError) && ( // Combined error display
            <div className="text-red-500 p-4 bg-red-50 rounded-md flex-grow">
              Error loading data:
              {isCompaniesError &&
                `Companies: ${companiesError?.message || "Unknown error"}`}
              {isCompaniesError && isPostsError && " | "}
              {isPostsError &&
                `Posts: ${postsError?.message || "Unknown error"}`}
            </div>
          )}

        {/* No data found message */}
        {!isInitialLoad &&
          !isCompaniesError &&
          !isPostsError &&
          posts.length === 0 && (
            <div className="text-center py-10 flex-grow text-muted-foreground">
              No questions found for the selected filters.
            </div>
          )}

        {/* Render posts if available */}
        {posts.length > 0 && ( // Render posts list if posts array is not empty (even with placeholder data)
          <>
            {/* Optional: Indicator for background fetching/updating posts */}
            {isPostsFetching && isPostsPlaceholderData && (
              <div className="text-center text-sm text-muted-foreground mb-2">
                Updating list...
              </div>
            )}

            {/* Posts List */}
            <div className="space-y-5 overflow-y-auto pr-2 pb-4 flex-grow ">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <PrimaryQuestionCard
                    key={post.topic_id} // Use topic_id as key
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-auto pt-4 border-t bg-background z-10 flex-shrink-0">
                <PaginationDemo
                  count={totalPages}
                  initialPage={currentPage}
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
