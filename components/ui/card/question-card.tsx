// components/ui/card/question-card.tsx
"use client";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Briefcase,
  Eye,
} from "lucide-react";

import Link from "next/link"; // For the "View Full Post" link

// Reuse interfaces from page.tsx or define here if preferred
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

interface QuestionCardProps {
  topicId: number;
  title: string;
  companies: string[];
  date?: string | null; // Original post date
  extractedQuestions: ExtractedQuestion[];
  views?: number; // Optional view count
  // Add slug if needed for LeetCode link construction
  // slug: string;
}

const QuestionCard = ({
  topicId,
  title,
  companies,
  date,
  extractedQuestions,
  views,
}: QuestionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => setExpanded(!expanded);

  // Use the first question's text as a snippet if available, otherwise a generic message
  const description =
    extractedQuestions.length > 0
      ? extractedQuestions[0].original_question_text.substring(0, 150) +
        (extractedQuestions[0].original_question_text.length > 150 ? "..." : "")
      : "Details inside...";

  const primaryRole =
    extractedQuestions.length > 0 &&
    extractedQuestions[0].refined_role !== "N/A"
      ? extractedQuestions[0].refined_role
      : null;

  const formatLeetCodeLink = (id: number | string) =>
    `https://leetcode.com/discuss/post/${id}`;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>

      <div className="flex flex-wrap gap-2 mt-2">
        {companies?.map((company) => (
          <span
            key={company}
            className="inline-flex items-center rounded-sm bg-blue-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-blue-600/20" // Adjusted styling
          >
            {company}
          </span>
        ))}

        {primaryRole && (
          <span
            key="primary-role"
            className="inline-flex items-center rounded-sm bg-green-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-green-600/20" // Different color for role
          >
            <Briefcase size={12} className="mr-1" /> {/* Optional icon */}
            {primaryRole}
          </span>
        )}

        {typeof views === "number" && views > 0 && (
          <span
            key="view-count"
            className="inline-flex items-center rounded-sm bg-green-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-yellow-600/20" // Different color for role
          >
            <Eye size={12} className="mr-1" /> {/* Optional icon */}
            {views}
          </span>
        )}
      </div>

      <p className="mt-2 text-md text-gray-600">{description}</p>

      {expanded && extractedQuestions.length > 0 && (
        <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
          {extractedQuestions.map((q, index) => (
            <div
              key={index}
              className="pb-2 mb-2 border-b border-gray-100 last:border-b-0"
            >
              <h4 className="text-md font-semibold text-gray-800 mb-1">
                Question {index + 1}:
              </h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                {q.original_question_text}
              </p>
              {(q.tags?.length > 0 ||
                q.refined_role !== "N/A" ||
                q.refined_company !== "N/A") && (
                <div className="text-xs text-gray-500 mb-2">
                  {q.tags?.length > 0 && (
                    <span>
                      Topics:{" "}
                      {q.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block bg-gray-100 rounded-full px-2 py-0.5 text-xs font-medium text-gray-600 mr-1 mb-1"
                        >
                          {tag}
                        </span>
                      ))}
                      <br />
                    </span>
                  )}
                  {q.refined_role !== "N/A" && (
                    <span>
                      Role: {q.refined_role}
                      <br />
                    </span>
                  )}
                  {q.refined_company !== "N/A" && (
                    <span>Company: {q.refined_company}</span>
                  )}
                </div>
              )}

              {/* Similar Questions (filtered) */}
              {q.similar_leetcode_questions?.filter(
                (sq) => sq.similarity_score > 0.65
              ).length > 0 && (
                <div className="mt-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Similar Platform Questions
                  </p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    {q.similar_leetcode_questions
                      .filter((sq) => sq.similarity_score > 0.65)
                      .map((sq, sqIdx) => (
                        <li key={sqIdx} className="text-xs">
                          <Link
                            href={sq.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center"
                          >
                            {sq.source
                              .split("/")
                              .pop()
                              ?.replace(/[-_]/g, " ") || sq.source}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Link>
                          <span className="text-gray-500 ml-1">
                            (Similarity:{" "}
                            {(
                              parseFloat(sq.similarity_score.toFixed(2)) * 100
                            ).toFixed(0)}
                            %)
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-500">{date || "Date N/A"}</span>
        <div className="flex items-center gap-2">
          <button
            className="text-white bg-gray-600 hover:bg-gray-700 border border-transparent px-3 py-1.5 rounded-md flex items-center text-sm font-medium transition-colors"
            onClick={toggleExpand}
          >
            {expanded ? "Hide Details" : "Show Details"}
            {expanded ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-1 h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
