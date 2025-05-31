import { FeedbackForm } from "@/components/custom/feedbackForm";

export default function Page() {
  return (
    <div className="flex h-[calc(100vh-65px)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <FeedbackForm />
      </div>
    </div>
  );
}
