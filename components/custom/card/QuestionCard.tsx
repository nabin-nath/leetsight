import { Badge } from "@/components/ui/badge";
import { Question } from "@/types";
import { Briefcase, Building2, LoaderCircle } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { IoBookmark, IoBookmarkOutline, IoCheckbox } from "react-icons/io5";
import { MdCheckBoxOutlineBlank } from "react-icons/md";
import MarkdownFormatter from "../MarkdownFormatter";

interface QuestionCardProps {
  question: Question;
  onToggleDone: () => void;
  isTogglingDone: boolean;
  onOpenSaveModal: () => void; // New prop
  type?: "question" | "list"; // Default type for this component
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onToggleDone,
  isTogglingDone,
  onOpenSaveModal, // New prop for opening save modal
  type = "question",
}) => {
  const { theme } = useTheme();

  return (
    <div className="p-4 border rounded-xl shadow-sm space-y-3 bg-card text-card-foreground">
      <h3 className="text-lg flex justify-between gap-2">
        <div className="flex items-start gap-2 w-[85%]">
          <div className="flex items-center justify-center text-secondary-foreground rounded-full min-w-[36px] min-h-[36px]">
            {theme === "light" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M64 256c0 88.4 71.6 160 160 160c28.9 0 56-7.7 79.4-21.1l-72-86.4c-11.3-13.6-9.5-33.8 4.1-45.1s33.8-9.5 45.1 4.1l70.9 85.1C371.9 325.8 384 292.3 384 256c0-88.4-71.6-160-160-160S64 167.6 64 256zM344.9 444.6C310 467 268.5 480 224 480C100.3 480 0 379.7 0 256S100.3 32 224 32s224 100.3 224 224c0 56.1-20.6 107.4-54.7 146.7l47.3 56.8c11.3 13.6 9.5 33.8-4.1 45.1s-33.8 9.5-45.1-4.1l-46.6-55.9z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path
                  fill="#ffffff"
                  d="M64 256c0 88.4 71.6 160 160 160c28.9 0 56-7.7 79.4-21.1l-72-86.4c-11.3-13.6-9.5-33.8 4.1-45.1s33.8-9.5 45.1 4.1l70.9 85.1C371.9 325.8 384 292.3 384 256c0-88.4-71.6-160-160-160S64 167.6 64 256zM344.9 444.6C310 467 268.5 480 224 480C100.3 480 0 379.7 0 256S100.3 32 224 32s224 100.3 224 224c0 56.1-20.6 107.4-54.7 146.7l47.3 56.8c11.3 13.6 9.5 33.8-4.1 45.1s-33.8 9.5-45.1-4.1l-46.6-55.9z"
                />
              </svg>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <MarkdownFormatter markdown={question.question_text} />
          </div>
        </div>
        {/* Save button - Assuming this is per question and user specific */}
        {type === "question" && (
          <div className="ml-3">
            <div className="flex items-center gap-1" onClick={onOpenSaveModal}>
              {/* Replace 'true' with actual save status from question object or separate state */}
              {false ? ( // Placeholder for actual save state
                <div className="flex items-center gap-1 text-sm text-primary border border-primary rounded-sm px-2 py-1 cursor-pointer">
                  {" "}
                  Saved <IoBookmark size={17} />{" "}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm text-primary border border-primary rounded-sm px-2 py-1 cursor-pointer">
                  {" "}
                  Save <IoBookmarkOutline size={17} />{" "}
                </div>
              )}
            </div>
          </div>
        )}
        {type === "list" && (
          <div className="ml-3">
            <div
              className="flex gap-1"
              onClick={() => {
                window.open(`/post/${question.topic_id}`, "_blank");
              }}
            >
              <div className="flex text-center justify-center border rounded-sm items-center gap-1 text-xs text-primary p-2 cursor-pointer">
                View Post?
              </div>
            </div>
          </div>
        )}
      </h3>
      <div className="flex gap-2">
        {question.role && question.role !== "N/A" && (
          <Badge variant="secondary">
            <Briefcase size={12} className="mr-1" />
            {question.role}
          </Badge>
        )}
        {question.companies.length > 0 && question.companies[0].name && (
          <Badge variant="secondary">
            <Building2 size={12} className="mr-1" />
            {question.companies[0].name}
          </Badge>
        )}
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {question.tags
              .filter((tag) => tag !== "N/A")
              .map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 items-end justify-between text-sm">
        <div>
          {question.similar_questions &&
            question.similar_questions.length > 0 && (
              <div className="space-y-1 mt-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Similar Questions
                </p>
                {question.similar_questions.map(
                  (
                    similar // use similar.id as key
                  ) => (
                    <Link
                      key={similar.id}
                      href={similar.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs hover:underline w-fit"
                    >
                      {similar.source}
                    </Link>
                  )
                )}
              </div>
            )}
        </div>
        <button
          className={`flex items-center gap-1 text-xs text-primary cursor-pointer ${
            isTogglingDone ? "opacity-50" : ""
          }`}
          onClick={onToggleDone}
          disabled={isTogglingDone}
        >
          {question.is_done ? "Viewed" : "Mark as viewed?"}
          {isTogglingDone ? (
            <span className="animate-spin">
              <LoaderCircle />
            </span>
          ) : question.is_done ? (
            <IoCheckbox size={15} />
          ) : (
            <MdCheckBoxOutlineBlank size={15} />
          )}
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
