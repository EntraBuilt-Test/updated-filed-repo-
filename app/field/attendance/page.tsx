import { PageHeader } from "@/components/page-components";
import { TodayPanel } from "@/components/today-panel";

export default function AttendancePage() {
  return (
    <>
      <PageHeader
        eyebrow="Attendance"
        title="Check-in"
        description="Mark attendance for the day and keep your field status visible to managers."
      />
      <TodayPanel />
    </>
  );
}
