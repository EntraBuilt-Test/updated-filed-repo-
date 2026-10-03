import { PageHeader } from "@/components/page-components";
import { FieldSurveys } from "@/components/field-surveys";

export default function SurveysReportPage() {
  return (
    <>
      <PageHeader eyebrow="Reports · My Surveys" title="My Surveys" description="Answer active surveys assigned by Admin." />
      <FieldSurveys />
    </>
  );
}
