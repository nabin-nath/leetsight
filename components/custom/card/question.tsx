// components/ui/card/question-card.tsx
"use client";
import { useState } from "react";
import {
  Flame,
  ExternalLink,
  Briefcase,
  Eye,
  Building2,
} from "lucide-react";
import Link from "next/link"; // For the "View Full Post" link
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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
              {yoe}{" "}Years of exp
            </Badge>
          )}

          {typeof views === "number" && views > 0 && (
            <Badge variant="secondary">
              <Eye size={12} className="mr-1" />
              {views}
            </Badge>
          )}
        </div>
      </div>

      {/* <p className="mt-2 text-md">{title}</p> */}

      

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs ">{leetcode_created_at || "Date N/A"}</span>
        <div className="flex items-center gap-2">
          <Link
            href={`/post/${topic_id}`}
            target="_blank"
            passHref
            className=" border border-transparent px-3 py-1.5 rounded-md flex items-center text-sm font-medium transition-colors"
          >
            View Full Post
            <ExternalLink className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrimaryQuestionCard;
