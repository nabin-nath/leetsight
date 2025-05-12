// app/questions/page.tsx
"use client";

import Navbar from "@/components/ui/navbar";
import Sidebar from "@/components/ui/sidebar";
import QuestionCard from "@/components/ui/card/question-card"; // Assuming QuestionCard is suitable
import PaginationRounded from "@/components/ui/pagination";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Briefcase,
  Building,
  Tag as TagIcon,
} from "lucide-react";

// Interfaces
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

interface ExtractedQuestionForCard {
  // Data structure QuestionCard expects
  original_question_text: string;
  tags: string[];
  refined_role: string;
  refined_company: string;
  similar_leetcode_questions: SimilarQuestion[];
}
interface CompanyQuestionFromAPI {
  // Matches the 'questions' array from API
  topicId: number;
  question_text: string;
  tags: string[];
  identifiers: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  role_name_context?: string; // Added by aggregation
  company_name_context?: string; // Added by aggregation
  systemProcessedAt?: string;
  leetcodeCreatedAt?: string | null;
}
interface CompanyQuestionsApiResponse {
  questions: CompanyQuestionFromAPI[];
  totalQuestions: number;
  currentPage: number;
  totalPages: number;
  roleName?: string;
  companyName?: string;
}
interface FiltersState {
  company: string;
  role: string;
  timePeriod: string;
}

const QUESTIONS_PER_PAGE = 10; // Separate limit for this page

export default function QuestionsByCompanyPage() {
  const [questionsOnPage, setQuestionsOnPage] = useState<
    CompanyQuestionFromAPI[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDisplayTitle, setCurrentDisplayTitle] = useState(
    "Filter to view questions"
  );

  const [availableCompanies, setAvailableCompanies] = useState<string[]>([
    "All Companies",
  ]);
  const [availableRoles, setAvailableRoles] = useState<string[]>(["All Roles"]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const initialFilters: FiltersState = {
    company: "All Companies",
    role: "All Roles",
    timePeriod: "Last Month", // Still needed for Sidebar consistency
  };
  const [activeFilters, setActiveFilters] =
    useState<FiltersState>(initialFilters);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/companies");
      if (!res.ok) throw new Error("Failed to fetch companies");
      const data = await res.json();
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
      const res = await fetch(
        `/api/roles?company=${encodeURIComponent(companyName)}`
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(
          errData.error || `Failed to fetch roles for ${companyName}`
        );
      }
      const data: string[] = await res.json();
      setAvailableRoles(["All Roles", ...data.sort()]);
    } catch (err) {
      console.error(`Error fetching roles for ${companyName}:`, err);
      setAvailableRoles(["All Roles"]);
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  const fetchCompanyQuestions = useCallback(
    async (page: number, filters: FiltersState) => {
      if (filters.company === "All Companies" || !filters.company) {
        setQuestionsOnPage([]);
        setTotalPages(1);
        setTotalQuestions(0);
        setCurrentDisplayTitle(
          "Please select a specific company to view questions."
        );
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        let url = `/api/company-questions?company=${encodeURIComponent(
          filters.company
        )}&page=${page}&limit=${QUESTIONS_PER_PAGE}`;
        if (filters.role && filters.role !== "All Roles") {
          url += `&role=${encodeURIComponent(filters.role)}`;
        }
        // Time period not directly used by this API, but kept in activeFilters for Sidebar
        if (filters.timePeriod && filters.timePeriod !== "All Time") {
          url += `&timePeriod=${encodeURIComponent(filters.timePeriod)}`;
        }
        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(
            errData.error || `Failed to fetch questions for ${filters.company}`
          );
        }
        const data: CompanyQuestionsApiResponse = await res.json();
        setQuestionsOnPage(data.questions);
        setTotalQuestions(data.totalQuestions);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setCurrentDisplayTitle(
          `Questions for ${data.companyName || filters.company}` +
            (data.roleName && data.roleName !== "All Roles"
              ? ` - Role: ${data.roleName}`
              : " - All Roles")
        );
      } catch (err) {
        console.error("Fetch error:", err);
        if (err instanceof Error) setError(err.message);
        else setError("An unknown error occurred");
        setQuestionsOnPage([]);
        setTotalPages(1);
        setTotalQuestions(0);
        setCurrentDisplayTitle(
          `Error loading questions for ${filters.company}`
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    // Fetch roles when active company changes
    if (activeFilters.company && activeFilters.company !== "All Companies") {
      fetchRolesForCompany(activeFilters.company);
    } else {
      setAvailableRoles(["All Roles"]);
    }
  }, [activeFilters.company, fetchRolesForCompany]);

  // Fetch questions when relevant filters or page change
  useEffect(() => {
    if (activeFilters.company && activeFilters.company !== "All Companies") {
      fetchCompanyQuestions(currentPage, activeFilters);
    } else {
      // Clear questions if no specific company is selected
      setQuestionsOnPage([]);
      setTotalPages(1);
      setTotalQuestions(0);
      setCurrentDisplayTitle("Select a company to view questions");
    }
  }, [currentPage, activeFilters, fetchCompanyQuestions]);

  const handleFiltersChange = (newFilters: FiltersState) => {
    const previousCompany = activeFilters.company;
    setActiveFilters(newFilters);
    setCurrentPage(1); // Reset page when filters change
    // Role fetching is now handled by the useEffect watching activeFilters.company
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
  };

  const formatDate = (
    dateString?: string | null
  ): string | null | undefined => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex flex-col lg:flex-row md:flex-row sm:flex-col pt-4 px-2 md:px-4 gap-5">
        <Sidebar
          availableCompanies={availableCompanies}
          availableRoles={availableRoles}
          onFiltersChange={handleFiltersChange}
          onCompanySelectedForRoleFetch={(companyName) => {
            // Simpler: just update company in active filters
            setActiveFilters((prev) => ({
              ...prev,
              company: companyName,
              role: "All Roles",
            }));
            setCurrentPage(1); // Reset page on company change
          }}
          initialFilters={activeFilters}
          isLoadingRoles={isLoadingRoles}
        />
        <div className="flex flex-col w-full bg-white rounded-lg p-4 md:p-6 shadow-xl h-[calc(100vh-80px)] overflow-hidden">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">
              {currentDisplayTitle}
            </h1>
            {activeFilters.company !== "All Companies" && (
              <p className="text-gray-500 mt-1">
                Showing questions for {activeFilters.company}
                {activeFilters.role !== "All Roles"
                  ? ` - Role: ${activeFilters.role}`
                  : " - All Roles"}
                . Sorted by last seen.
              </p>
            )}
          </div>

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

          {!isLoading &&
            !error &&
            activeFilters.company === "All Companies" && (
              <div className="text-center text-gray-500 py-10 flex-grow">
                Please select a specific company to view questions.
              </div>
            )}
          {!isLoading &&
            !error &&
            activeFilters.company !== "All Companies" &&
            questionsOnPage.length === 0 && (
              <div className="text-center text-gray-500 py-10 flex-grow">
                No questions found for the selected criteria.
              </div>
            )}

          {!isLoading && !error && questionsOnPage.length > 0 && (
            <>
              <div className="space-y-5 overflow-y-auto flex-grow pr-2 pb-4">
                {questionsOnPage.map((q, index) => {
                  // Adapt data for QuestionCard
                  const cardExtractedQuestions: ExtractedQuestion[] = [
                    {
                      original_question_text: q.question_text,
                      tags: q.tags,
                      refined_role: q.role_name_context || "N/A", // Use context role
                      refined_company: q.company_name_context || "N/A", // Use context company
                      similar_leetcode_questions: [], // This data is not in company_questions
                    },
                  ];

                  return (
                    <QuestionCard
                      key={q.topicId + "-" + index} // Assuming _instance_key exists or use another unique prop
                      topicId={q.topicId}
                      title={
                        q.question_text.substring(0, 100) +
                        (q.question_text.length > 100 ? "..." : "")
                      } // Use question text as title
                      companies={
                        q.company_name_context ? [q.company_name_context] : []
                      }
                      date={formatDate(q.leetcodeCreatedAt)} // Or lastSeenAt
                      extractedQuestions={cardExtractedQuestions}
                    />
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="mt-auto pt-4 border-t border-gray-200">
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
