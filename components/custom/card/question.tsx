// components/ui/card/question-card.tsx
"use client";
import { useState } from "react";
import {
  Flame,
  ExternalLink,
  Briefcase,
  Eye,
  Building2,
  ThumbsUp,
  ThumbsDown,
  FileSearch,
} from "lucide-react";
import Link from "next/link"; // For the "View Full Post" link
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  RiThumbDownFill,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine,
} from "react-icons/ri";

// Reuse interfaces from page.tsx or define here if preferred
interface SimilarQuestion {
  source: string;
  similarity_score: number;
}

interface ExtractedQuestion {
  id: string;
  question_text: string;
  tags: string[];
  role: string;
  company_id: string;
}

interface Company {
  name: string;
  id: number;
}

interface QuestionCardProps {
  topic_id: number;
  title: string;
  companies: Company[] | [];
  leetcode_created_at?: string | null; // Original post date
  yoe: string;
  views?: number; // Optional view count
  tags: string[] | null;
  roles: string[] | [];
  questions_extracted: number;
  likes_count: number;
  dislikes_count: number;
  is_liked: boolean;
  is_disliked: boolean;
}

const PrimaryQuestionCard = ({
  topic_id,
  title,
  companies,
  leetcode_created_at,
  yoe,
  views,
  tags,
  roles,
  questions_extracted,
  likes_count,
  dislikes_count,
  is_liked,
  is_disliked,
}: QuestionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => setExpanded(!expanded);
  const router = useRouter();

  const handleClick = () => {
    // console.log(`Navigating to post with topic_id: ${topic_id}`);
    router.push(`/post/${topic_id}`);
  };

  // Use the first question's text as a snippet if available, otherwise a generic message

  return (
    <div
      onClick={handleClick}
      className="border rounded-lg lg:m-2 p-4 transition-all hover:bg-accent shadow-sm"
    >
      <h3 className="text-lg font-medium ">{title}</h3>

      <div>
        <div className="flex flex-wrap gap-2 mt-2">
          {companies?.map((com, id) => (
            <Badge variant="secondary" key={id}>
              <Building2 size={12} className="mr-1" />
              {com.name}
            </Badge>
          ))}

          {roles
            .filter((role) => role != "N/A")
            .map((role, id) => (
              <Badge variant="secondary" key={id}>
                <Briefcase size={12} className="mr-1" />
                {role}
              </Badge>
            ))}

          {typeof yoe === "number" && yoe > 0 && (
            <Badge variant="secondary">
              <Flame size={12} className="mr-1" />
              {yoe} Years of exp
            </Badge>
          )}

          {typeof views === "number" && views > 0 && (
            <Badge variant="secondary">
              <Eye size={12} className="mr-1" />
              {views}
            </Badge>
          )}

          {typeof questions_extracted === "number" &&
            questions_extracted > 0 && (
              <Badge variant="secondary">
                <FileSearch size={12} className="mr-1" />
                {questions_extracted} questions found
              </Badge>
            )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs ">{leetcode_created_at || "Date N/A"}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {is_liked ? (
              <>
                <RiThumbUpFill size={16} /> {likes_count}
              </>
            ) : (
              <>
                <RiThumbUpLine size={16} /> {likes_count}
              </>
            )}
          </Badge>

          <Badge variant="outline">
            {is_disliked ? (
              <>
                <RiThumbDownFill size={16} /> {dislikes_count}
              </>
            ) : (
              <>
                <RiThumbDownLine size={16} /> {dislikes_count}
              </>
            )}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default PrimaryQuestionCard;
