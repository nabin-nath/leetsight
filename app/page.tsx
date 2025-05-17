// app/page.tsx (Assuming this is your main page, e.g., for "Recent Posts")
"use client";

import Navbar from "@/components/ui/navbar";
import PaginationRounded from "@/components/ui/pagination";
import QuestionCard from "@/components/ui/card/question-card";
import PrimaryQuestionCard from "@/components/ui/card/question";
import Sidebar from "@/components/ui/sidebar";
import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/apiClient";

// Define interfaces (Keep them as they are)
interface SimilarQuestion {
  source: string;
  similarity_score: number;
}
interface ExtractedQuestion {
  original_question_text: string;
  tags: string[];
  refined_role: string;
  refined_company: string;
  similar_leetcode_questions: SimilarQuestion[];
}
interface ProcessedPost {
  _id: string;
  topicId: number;
  title: string;
  slug: string;
  leetcodeCreatedAt?: string | null;
  systemProcessedAt?: string;
  companies_mentioned_in_post: string[];
  questions_extracted: ExtractedQuestion[];
  views?: number; // Optional view count
}
interface RecentPostsApiResponse {
  posts: ProcessedPost[];
  total_posts: number;
  current_page: number;
  total_pages: number;
}

const POSTS_PER_PAGE = 10;

// Define initial filter state type
interface FiltersState {
  company: string;
  role: string;
  timePeriod: string;
}

export default function Home() {
  const [posts, setPosts] = useState<ProcessedPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // const [totalPosts, setTotalPosts] = useState(0); // totalPosts from API response will be used
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableCompanies, setAvailableCompanies] = useState<string[]>([
    "All Companies",
  ]);
  const [availableRoles, setAvailableRoles] = useState<string[]>(["All Roles"]); // For the role filter
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const initialFilters: FiltersState = {
    company: "All Companies",
    role: "All Roles",
    timePeriod: "Last Month", // Default time period
  };
  const [activeFilters, setActiveFilters] =
    useState<FiltersState>(initialFilters);

  // Fetch available companies for the filter dropdown (runs once)
  const fetchCompanies = useCallback(async () => {
    try {
      const res = await apiClient.get("/company-questions/distinct_companies");
      if (res.status < 200 || res.status >= 300)
        throw new Error("Failed to fetch companies");
      const data = res.data;
      setAvailableCompanies(["All Companies", ...data.sort()]);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setAvailableCompanies(["All Companies"]);
    }
  }, []);

  const fetchRolesForCompany = useCallback(async (companyName: string) => {
    if (companyName === "All Companies" || !companyName) {
      setAvailableRoles(["All Roles"]);
      // No need to set activeFilters.role here, handleApplyFilters will manage that
      return;
    }
    setIsLoadingRoles(true);
    setAvailableRoles(["Loading..."]); // Provide immediate feedback

    try {
      const res = await apiClient.get(
        `/company-questions/roles_by_company/?company=${encodeURIComponent(
          companyName
        )}`
      );
      if (res.status < 200 || res.status >= 300) {
        const errData = res.data;
        throw new Error(
          errData.error || `Failed to fetch roles for ${companyName}`
        );
      }
      const data: string[] = res.data;
      setAvailableRoles(["All Roles", ...data.sort()]);
    } catch (err) {
      console.error(`Error fetching roles for ${companyName}:`, err);
      setAvailableRoles(["All Roles"]);
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  // Main data fetching function
  const fetchData = useCallback(async (page = 1, filters: FiltersState) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/processed-posts/?page=${page}&limit=${POSTS_PER_PAGE}`;
      if (filters.company && filters.company !== "All Companies")
        url += `&company=${encodeURIComponent(filters.company)}`;
      if (filters.role && filters.role !== "All Roles")
        url += `&role=${encodeURIComponent(filters.role)}`;
      if (filters.timePeriod && filters.timePeriod !== "All Time")
        url += `&time_period=${encodeURIComponent(filters.timePeriod)}`;

      const res = await apiClient.get(url);
      if (res.status < 200 || res.status >= 300) {
        const errData = res.data;
        throw new Error(errData.error || `Failed to fetch posts`);
      }
      const data: RecentPostsApiResponse = res.data;
      setPosts(data.posts);
      setTotalPages(data.total_pages);
      setCurrentPage(data.current_page);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError("Unknown error");
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    fetchData(currentPage, activeFilters);
  }, [currentPage, activeFilters, fetchData]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Date N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleCompanySelectedInSidebar = (companyName: string) => {
    // We don't update activeFilters.company here to avoid an immediate data re-fetch.
    // We only fetch roles. The actual filter application happens on "Apply Filters".
    fetchRolesForCompany(companyName);
  };

  const handleFiltersChangeFromSidebar = (
    newFiltersFromSidebar: FiltersState
  ) => {
    setActiveFilters(newFiltersFromSidebar); // Directly set active filters
    setCurrentPage(1);
    // Note: fetchRolesForCompany is NOT called here directly anymore.
    // It's called by handleCompanySelectedInSidebar.
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {" "}
      {/* Changed background slightly */}
      <Navbar />
      <div className="flex flex-col lg:flex-row md:flex-row sm:flex-col pt-4 px-2 md:px-4 gap-5">
        {" "}
        {/* Added gap */}
        <Sidebar
          availableCompanies={availableCompanies}
          availableRoles={availableRoles}
          onFiltersChange={handleFiltersChangeFromSidebar}
          onCompanySelectedForRoleFetch={handleCompanySelectedInSidebar}
          initialFilters={activeFilters}
          isLoadingRoles={isLoadingRoles} // Pass loading state for roles
        />
        <div className="flex flex-col w-full bg-white rounded-lg p-4 md:p-6 shadow-xl h-[calc(100vh-80px)] overflow-hidden">
          {" "}
          {/* Enhanced shadow, rounded-lg */}
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">
              Recent Interview experiences
            </h1>
            <p className="text-gray-500 mt-1">
              Browse the latest technical interview experiences from top
              companies.
            </p>
          </div>
          {/* Question List & Loading/Error States */}
          {isLoading && (
            <div className="flex justify-center items-center flex-grow">
              <p>Loading questions...</p>
            </div>
          )}
          {error && (
            <div className="text-red-500 p-4 bg-red-50 rounded-md flex-grow">
              Error: {error}
            </div>
          )}
          {!isLoading && !error && posts.length === 0 && (
            <div className="text-center text-gray-500 py-10 flex-grow">
              No questions found for the selected filters.
            </div>
          )}
          {!isLoading && !error && posts.length > 0 && (
            <>
              <div className="space-y-5 overflow-y-auto flex-grow pr-2 pb-4">
                {" "}
                {/* Adjusted spacing and padding */}
                {posts.map((post) => (
                  <PrimaryQuestionCard
                    key={post._id}
                    topicId={post.topicId}
                    title={post.title}
                    companies={post.companies_mentioned_in_post}
                    date={formatDate(post.leetcodeCreatedAt)}
                    extractedQuestions={post.questions_extracted}
                    views={post.views}
                  />
                ))}
              </div>
              {/* --- Pagination Section with Separator --- */}
              {totalPages > 1 && (
                <div className="mt-auto pt-4 border-t border-gray-200">
                  {" "}
                  {/* Added border-t */}
                  <PaginationRounded
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
