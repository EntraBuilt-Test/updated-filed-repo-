import { PageHeader } from "@/components/page-components";
import { FieldVisitLogScreen } from "@/components/field-visit-log";

export default function VisitLogReportPage() {
  return (
    <>
      <PageHeader eyebrow="Reports · My Visit Log" title="My Visit Log" description="Log Stockist, Unlisted Doctor and CIP visits with check-in/out times." />
      <FieldVisitLogScreen />
    </>
  );
}
