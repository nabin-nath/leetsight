"use client";

import {
  MessageSquareText,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Tag,
  ChevronLeft, // Import ChevronLeft icon
  ExternalLink,
  Building, // Keep other imports
  CircleHelp,
  Building2,
  Briefcase,
  Flame,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation"; // Import useRouter
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import MarkdownFormatter from "@/components/custom/MarkdownFormatter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Interfaces (ensure these are consistent)
interface PostResponse {
  post: Post;
  questions: Question[];
}

interface Post {
  title: string;
  author: string | null;
  content: string;
  slug: string;
  tags: string[] | null;
  leetcode_created_at: string;
  upvote: number;
  downvote: number;
  yoe: number | null;
  views: number;
  company_ids: number[];
  status: string;
  topic_id: number;
  created_at: string;
  updated_at: string;
  companies: Company[];
  roles: string[] | [];
}

interface Company {
  id: number;
  name: string;
}

interface Question {
  topic_id: number;
  question_text: string;
  role: string;
  company_id: number;
  tags: string[] | null;
  id: string;
  created_at: string;
  updated_at: string;
  similar_questions: SimilarQuestion[];
  companies: Company[];
}

interface SimilarQuestion {
  question_id: string;
  source: string; // This should ideally be a URL or identifier
  score: number;
  id: string; // Assuming this is a unique ID for the similar question record
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString; // Fallback for invalid date strings
  }
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter(); // Get router instance
  const topicIdFromUrl = params?.topicid as string;

  const [postData, setPostData] = useState<PostResponse | null>(null);
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
      const res = await apiClient.get(`/posts/${id}/questions`);
      if (res.status < 200 || res.status >= 300) {
        const errData = res.data;
        throw new Error(errData.error || "Failed to fetch post details");
      }
      const data: PostResponse = res.data;
      setPostData(data);
    } catch (err) {
      console.error("Error fetching post details:", err); // Log error for debugging
      if (err instanceof Error) setError(err.message);
      else setError("An unknown error occurred");
      setPostData(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // fetchPostDetail has no external dependencies that change

  useEffect(() => {
    if (topicIdFromUrl) {
      fetchPostDetail(topicIdFromUrl);
    }
  }, [topicIdFromUrl]); // Effect depends on topicIdFromUrl and fetchPostDetail

  // Handle back button click
  const handleBackClick = () => {
    router.back(); // Use router.back() to navigate to the previous page in history
  };

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
  if (!postData)
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-muted-foreground">Post not found.</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Back Button */}
      <button
        onClick={handleBackClick} // Attach the handler
        className="flex items-center text-sm text-muted-foreground hover:underline mb-4 cursor-pointer"
      >
        <ChevronLeft size={16} className="mr-1" /> Back to Posts
      </button>

      {/* Post Details */}
      <div className="p-6 rounded-2xl border bg-card shadow-lg space-y-4">
        <h1 className="text-2xl font-bold">{postData.post.title}</h1>
        {/* Removed slug display - adjust as needed */}
        {/* <p className="text-sm">Slug: {postData.post.slug}</p> */}

        {/* Post Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {postData.post.companies.length > 0 && (
            <div className="flex items-center gap-2">
              {postData.post.companies.map((com, id) => (
                <Badge variant="secondary" key={id}>
                  <Building2 size={12} className="mr-1" />
                  {com.name}
                </Badge>
              ))}
            </div>
          )}

          {postData.post.roles.length > 0 && (
            <div className="flex items-center gap-2">
              {postData.post.roles
                .filter((role) => role != "N/A")
                .map((role, id) => (
                  <Badge variant="secondary" key={id}>
                    <Briefcase size={12} className="mr-1" />
                    {role}
                  </Badge>
                ))}
            </div>
          )}

          {typeof postData.post.yoe === "number" && postData.post.yoe > 0 && (
            <Badge variant="secondary">
              <Flame size={12} className="mr-1" />
              {postData.post.yoe} Years of exp
            </Badge>
          )}

          {typeof postData.post.views === "number" &&
            postData.post.views > 0 && (
              <Badge variant="secondary">
                <Eye size={12} className="mr-1" />
                {postData.post.views}
              </Badge>
            )}
          <div className="flex items-center gap-1">
            <ThumbsUp size={16} /> {postData.post.upvote}
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown size={16} /> {postData.post.downvote}
          </div>

          <div className="flex items-center gap-1">
            <span>
              Created: {formatDate(postData.post.leetcode_created_at)}
            </span>
          </div>
        </div>

        {/* Post Tags */}
        {postData.post.tags && postData.post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {postData.post.tags.map((tag, index) => (
              // Use a neutral or secondary badge style
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground"
              >
                <Tag size={12} /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* Link to Original LeetCode Post */}
        <Button variant="outline" className="mt-4">
          <Link
            href={`https://leetcode.com/discuss/post/${postData.post.topic_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-primary"
          >
            View Original Post on LeetCode
            <ExternalLink className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Extracted Questions Section */}
      <div className="space-y-6 mt-6">
        {" "}
        {/* Added mt-6 for spacing */}
        <h2 className="text-2xl font-bold border-b pb-2">
          Extracted Questions
        </h2>
        {postData.questions.length > 0 ? (
          postData.questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))
        ) : (
          <p className="text-muted-foreground">
            No specific questions were extracted from this post.
          </p>
        )}
      </div>
    </div>
  );
}

// Re-styled QuestionCard slightly for better appearance within the post detail page
const QuestionCard: React.FC<{ question: PostResponse["questions"][0] }> = ({
  question,
}) => {
  return (
    <div className="p-4 border rounded-xl shadow-sm space-y-3 bg-card text-card-foreground">
      <h3 className="text-lg flex items-start gap-2">
        <CircleHelp size={45} className="flex-shrink-0 mt-1" />
        <div className="flex flex-col">
          <MarkdownFormatter markdown={question.question_text} />
        </div>
      </h3>
      {/* Displaying relevant question metadata */}
      <div className="flex gap-2">
        {question.role && question.role != "N/A" && (
          <p className="text-sm flex items-center text-muted-foreground">
            {question.role && (
              <Badge variant="secondary">
                <Briefcase size={12} className="mr-1" />
                {question.role}
              </Badge>
            )}
          </p>
        )}

        {question.companies.length > 0 && (
          <p className="text-sm flex items-center text-muted-foreground">
            {question.companies.length > 0 && question.companies[0].name && (
              <Badge variant="secondary">
                <Building2 size={12} className="mr-1" />
                {question.companies[0].name}
              </Badge>
            )}
          </p>
        )}

        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {question.tags
              .filter((tag) => tag != "N/A")
              .map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground" // Use secondary badge style
                >
                  {tag}
                </span>
              ))}
          </div>
        )}
      </div>
      {question.similar_questions && question.similar_questions.length > 0 && (
        <div className="space-y-1 mt-3">
          <p className="text-sm font-medium text-muted-foreground">
            Similar Questions:
          </p>
          {question.similar_questions.map((similar, index) => (
            // Ensure source is a valid URL if you're rendering it as a link
            <Link
              key={index} // Use index if similar.id might not be unique globally
              href={similar.source} // Assuming source is a URL
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs hover:underline"
            >
              {similar.source}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
