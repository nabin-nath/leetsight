// --- START OF FILE page.tsx ---
"use client";
import * as React from "react";
import PrimaryQuestionCard from "@/components/custom/card/question";
import { useState, useEffect, useCallback, useRef } from "react";
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

interface QueryKeyPostFilters {
  companyId: string;
  role: string;
  pageSize: string;
  fromDate?: string;
  toDate?: string;
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
    if (isNaN(dateObj.getTime())) {
      const isoDateObj = parseISO(dateString);
      if (isValid(isoDateObj)) {
        return format(isoDateObj, "MMM dd, yyyy");
      }
      return dateString;
    }
    return format(dateObj, "MMM dd, yyyy");
  } catch (e) {
    console.error("Unable to parse dateString: ", dateString, e);
    return dateString;
  }
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export default function HomeWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense
        fallback={
          <div className="mx-auto my-auto flex justify-center items-center">
            Loading data...
          </div>
        }
      >
        <Home />
      </Suspense>
    </QueryClientProvider>
  );
}

function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyIdForCurrentRolesRef = useRef<string | number>("1000");

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

  const [currentPage, setCurrentPage] = useState<number>(getInitialPage);
  const [activeFilters, setActiveFilters] =
    useState<FiltersState>(getInitialFilters);
  const [availableRoles, setAvailableRoles] = useState<string[]>(["All Roles"]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const {
    data: companiesData,
    isLoading: isCompaniesLoading,
    isError: isCompaniesError,
    error: companiesError,
  } = useQuery<CompanyOption[], Error>({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await apiClient.get("/companies");
      if (res.status < 200 || res.status >= 300)
        throw new Error("Failed to fetch companies");
      const data = res.data as CompanyOption[];
      return [{ name: "All Companies", id: "1000" }, ...data];
    },
    staleTime: Infinity,
  });

  const availableCompanies = companiesData || [
    { name: "All Companies", id: "1000" },
  ];

  // --- MODIFICATION: Remove isLoadingRoles from useCallback dependency array ---
  const fetchRolesForCompany = useCallback(
    async (companyIdToFetch: string | number) => {
      // Read the current value of isLoadingRoles directly.
      // This is fine because useCallback creates a closure over the state setters.
      // The bail-out condition `!isLoadingRoles` will use the value of isLoadingRoles
      // at the time fetchRolesForCompany is *called*, not when it was defined.
      // However, for the specific bail-out to work as intended (preventing re-fetch if already loading *for the same ID*),
      // the check against companyIdForCurrentRolesRef.current is more critical.
      // If roles are for a different company, we want to load regardless of isLoadingRoles.
      if (
        String(companyIdToFetch) ===
          String(companyIdForCurrentRolesRef.current) &&
        !isLoadingRoles // Check if NOT currently loading (i.e., roles are considered settled for this ID)
      ) {
        // console.log(`Roles for company ${companyIdToFetch} already present and not loading. Skipping fetch.`);
        return;
      }

      if (!companyIdToFetch || String(companyIdToFetch) === "1000") {
        // Only update state if it's actually different to avoid unnecessary re-renders.
        if (
          companyIdForCurrentRolesRef.current !== "1000" ||
          availableRoles.length > 1 ||
          availableRoles[0] !== "All Roles"
        ) {
          setAvailableRoles(["All Roles"]);
          companyIdForCurrentRolesRef.current = "1000";
        }
        if (isLoadingRoles) setIsLoadingRoles(false); // Ensure loading is false if it was true
        return;
      }

      // If we reach here, we are fetching for a new company ID, or for the same ID but we want to force a reload (not covered by current logic but possible)
      // or the current roles are not for this companyId
      setIsLoadingRoles(true);
      setAvailableRoles(["Loading..."]);

      try {
        const res = await apiClient.get(
          `/companies/${encodeURIComponent(companyIdToFetch)}/roles`
        );
        if (res.status < 200 || res.status >= 300) {
          const errData = res.data;
          throw new Error(
            errData.error ||
              `Failed to fetch roles for company ID ${companyIdToFetch} (Status: ${res.status})`
          );
        }
        const data: string[] = res.data;
        setAvailableRoles([
          "All Roles",
          ...data.filter((role) => role && role !== "N/A").sort(),
        ]);
        companyIdForCurrentRolesRef.current = companyIdToFetch;
      } catch (err) {
        console.error(
          `Error fetching roles for company ID ${companyIdToFetch}:`,
          err
        );
        setAvailableRoles(["All Roles"]);
        companyIdForCurrentRolesRef.current = "1000";
      } finally {
        setIsLoadingRoles(false);
      }
    },
    // Dependencies: `setAvailableRoles` and `setIsLoadingRoles` are stable.
    // `companyIdForCurrentRolesRef` is a ref and doesn't cause re-creation of the callback.
    // `isLoadingRoles` was the culprit, now removed.
    [] // apiClient is assumed stable and outside component scope
  );

  useEffect(() => {
    const currentCompanyId = activeFilters.companyId;

    if (companiesData && currentCompanyId && currentCompanyId !== "1000") {
      const companyExists = companiesData.some(
        (c) => String(c.id) === currentCompanyId
      );
      if (companyExists) {
        fetchRolesForCompany(currentCompanyId);
      } else {
        // This case needs to be careful: setActiveFilters will trigger a re-render,
        // and this useEffect will run again.
        console.warn(
          `Company ID "${currentCompanyId}" from URL not found in available companies. Resetting filter.`
        );
        // Only set if different to avoid loop if already "1000"
        if (
          activeFilters.companyId !== "1000" ||
          activeFilters.role !== "All Roles"
        ) {
          setActiveFilters((prev) => ({
            ...prev,
            companyId: "1000",
            role: "All Roles",
          }));
        } else {
          // If already default, ensure roles are reset if needed (though fetchRolesForCompany("1000") below would handle it)
          if (companyIdForCurrentRolesRef.current !== "1000") {
            fetchRolesForCompany("1000");
          }
        }
      }
    } else if (companiesData && activeFilters.companyId === "1000") {
      // If "All Companies" is selected, ensure roles are "All Roles".
      // fetchRolesForCompany will handle idempotency.
      fetchRolesForCompany("1000");
    }
  }, [
    companiesData,
    activeFilters.companyId,
    activeFilters.role,
    fetchRolesForCompany,
    setActiveFilters,
  ]);
  // Added activeFilters.role to deps of useEffect, if role reset is tied to company reset.

  const queryKeyFiltersForPosts: QueryKeyPostFilters = {
    companyId: activeFilters.companyId,
    role: activeFilters.role,
    pageSize: activeFilters.pageSize,
    fromDate: activeFilters.fromDate
      ? format(activeFilters.fromDate, "yyyy-MM-dd")
      : undefined,
    toDate: activeFilters.toDate
      ? format(activeFilters.toDate, "yyyy-MM-dd")
      : undefined,
  };

  const {
    data: postData,
    isLoading: isPostsLoading,
    // ... (rest of the posts query is unchanged) ...
    isError: isPostsError,
    error: postsError,
    isFetching: isPostsFetching,
    isPlaceholderData: isPostsPlaceholderData,
  } = useQuery<RecentPostsApiResponse, Error>({
    queryKey: ["posts", { ...queryKeyFiltersForPosts, page: currentPage }],
    queryFn: async ({ queryKey }) => {
      const [, filtersFromKey] = queryKey as [
        string,
        QueryKeyPostFilters & { page: number }
      ];
      const { page, companyId, role, pageSize, fromDate, toDate } =
        filtersFromKey;

      const limit = parseInt(pageSize, 10);
      if (isNaN(limit) || limit <= 0) {
        throw new Error("Invalid page size.");
      }
      let url = `/posts?skip=${(page - 1) * limit}&limit=${limit}`;
      if (companyId && companyId !== "1000")
        url += `&company_id=${encodeURIComponent(companyId)}`;
      if (role && role !== "All Roles")
        url += `&role=${encodeURIComponent(role)}`;
      if (fromDate) url += `&start_date=${fromDate}`;
      if (toDate) url += `&end_date=${toDate}`;

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
      setCurrentPage(page);
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set("page", page.toString());
      router.push(`/?${currentParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleFiltersChangeFromSidebar = useCallback(
    (newFiltersFromSidebar: FiltersState) => {
      setActiveFilters(newFiltersFromSidebar);
      setCurrentPage(1);
      const newParams = new URLSearchParams();
      newParams.set("page", "1");
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
    [router] // setActiveFilters, setCurrentPage are stable
  );

  const handleCompanySelectedForRoleFetch = useCallback(
    async (companyId: string) => {
      fetchRolesForCompany(companyId);
    },
    [fetchRolesForCompany]
  );

  const isInitialLoad =
    isCompaniesLoading ||
    (isPostsLoading && !isPostsPlaceholderData && !postData);

  // ... (JSX remains the same) ...
  return (
    <div className="">
      <div className="flex flex-col w-full rounded-lg p-4 md:p-6 shadow-xl md:h-[calc(100vh-65px)] overflow-hidden">
        <div className="mb-4">
          <p className="mt-1 text-muted-foreground">
            Browse the latest technical interview experiences from top
            companies.
          </p>

          <ApplyFiltersCard
            availableCompanies={availableCompanies}
            availableRoles={availableRoles}
            initialFilters={activeFilters}
            isLoadingRoles={isLoadingRoles}
            onCompanySelectedForRoleFetch={handleCompanySelectedForRoleFetch}
            onFiltersChange={handleFiltersChangeFromSidebar}
          />
        </div>

        {isInitialLoad && (
          <div className="flex justify-center items-center flex-grow">
            <p>Loading data...</p>
          </div>
        )}
        {!isInitialLoad && (isCompaniesError || isPostsError) && (
          <div className="text-red-500 p-4 bg-red-50 rounded-md flex-grow">
            Error loading data:
            {isCompaniesError &&
              `Companies: ${companiesError?.message || "Unknown error"}`}
            {isCompaniesError && isPostsError && " | "}
            {isPostsError && `Posts: ${postsError?.message || "Unknown error"}`}
          </div>
        )}

        {!isInitialLoad &&
          !isCompaniesError &&
          !isPostsError &&
          posts.length === 0 && (
            <div className="text-center py-10 flex-grow text-muted-foreground">
              No questions found for the selected filters.
            </div>
          )}

        {posts.length > 0 && (
          <>
            {isPostsFetching && isPostsPlaceholderData && (
              <div className="text-center text-sm text-muted-foreground mb-2">
                Updating list...
              </div>
            )}

            <div className="space-y-5 overflow-y-auto pr-2 pb-4 flex-grow ">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <PrimaryQuestionCard
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
