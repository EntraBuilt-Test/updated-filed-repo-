import { PageHeader } from "@/components/page-components";
import { FieldActivityStatusReport } from "@/components/field-activity-status";

export default function ActivityStatusReportPage() {
  return (
    <>
      <PageHeader eyebrow="Reports · My Activity Status" title="Activity Status" description="Activities tracked against you and their completion state." />
      <FieldActivityStatusReport />
    </>
  );
}
