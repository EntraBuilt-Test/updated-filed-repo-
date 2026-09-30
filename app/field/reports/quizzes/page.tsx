import { PageHeader } from "@/components/page-components";
import { FieldQuizzes } from "@/components/field-quizzes";

export default function QuizzesReportPage() {
  return (
    <>
      <PageHeader eyebrow="Reports · My Quizzes" title="My Quizzes" description="Take active quizzes and view your past attempt scores." />
      <FieldQuizzes />
    </>
  );
}
