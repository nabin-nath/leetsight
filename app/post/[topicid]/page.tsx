// app/post/[topicId]/page.tsx
"use client";

import Navbar from "@/components/ui/navbar";
import QuestionCard from "@/components/ui/card/question-card"; // <-- Import QuestionCard
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ChevronLeft, Building } from "lucide-react";

// Interfaces (ensure these are consistent)
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
  companies_mentioned_in_post: string[];
  questions_extracted: ExtractedQuestion[];
  systemProcessedAt?: string;
}

// Helper Functions (keep these or import from a shared util)
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
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
const formatLeetCodeLink = (id: number | string) =>
  `https://leetcode.com/discuss/post/${id}`;

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicIdFromUrl = params?.topicId as string;

  const [post, setPost] = useState<ProcessedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPostDetail = useCallback(async (id: string) => {
    if (!id || isNaN(parseInt(id))) {
      setError("Invalid Post ID.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/post-detail/${id}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch post details");
      }
      const data: ProcessedPost = await res.json();
      setPost(data);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("An unknown error occurred");
      setPost(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (topicIdFromUrl) {
      fetchPostDetail(topicIdFromUrl);
    }
  }, [topicIdFromUrl, fetchPostDetail]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground animate-pulse">Loading post details...</p>
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-destructive p-4 bg-destructive/10 rounded-md">
          Error: {error}
        </p>
      </div>
    );
  if (!post)
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-muted-foreground">Post not found.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto p-4 md:px-8 py-6">
        {" "}
        {/* Removed max-w-4xl to allow QuestionCards more space if needed */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-1">
            <span>
              Original Post Date: {formatDate(post.leetcodeCreatedAt)}
            </span>
            <a
              href={formatLeetCodeLink(post.topicId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center"
            >
              View on LeetCode <ExternalLink size={12} className="ml-1" />
            </a>
          </div>
          {post.companies_mentioned_in_post &&
            post.companies_mentioned_in_post.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-2">
                <Building size={14} className="text-muted-foreground mr-1" />
                <span className="text-xs text-muted-foreground mr-1">
                  Companies in Post:
                </span>
                {post.companies_mentioned_in_post.map((company) => (
                  <span
                    key={company}
                    className="inline-flex items-center rounded-sm bg-blue-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-blue-600/20"
                  >
                    {company}
                  </span>
                ))}
              </div>
            )}
        </div>
        <hr className="my-6 border-border" />
        <section>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-5">
            Extracted Questions from this Experience
          </h2>
          {post.questions_extracted.length === 0 ? (
            <p className="text-muted-foreground">
              No specific technical questions were extracted from this post.
            </p>
          ) : (
            <div className="space-y-6">
              {/* --- Map over extracted questions and render a QuestionCard for each --- */}
              {post.questions_extracted.map((extracted_q_data, index) => (
                <QuestionCard
                  key={`${post.topicId}-${index}`} // More unique key
                  topicId={post.topicId} // Pass the main post's topicId
                  // title for QuestionCard can be the question text itself or a generic "Question X"
                  title={`Question ${
                    index + 1
                  }: ${extracted_q_data.original_question_text.substring(
                    0,
                    70
                  )}${
                    extracted_q_data.original_question_text.length > 70
                      ? "..."
                      : ""
                  }`}
                  // Companies for this specific question's context
                  companies={
                    extracted_q_data.refined_company !== "N/A"
                      ? [extracted_q_data.refined_company]
                      : []
                  }
                  // Date for QuestionCard can be the main post's date
                  date={formatDate(post.leetcodeCreatedAt)}
                  // Pass only the current question's data to extractedQuestions prop
                  // as QuestionCard is designed to show details of ONE primary question
                  // and its similar questions.
                  // Here, each "card" IS an extracted question.
                  extractedQuestions={[extracted_q_data]} // Wrap in array
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
