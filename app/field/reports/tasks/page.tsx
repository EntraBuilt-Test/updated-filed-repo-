import { PageHeader } from "@/components/page-components";
import { FieldTasks } from "@/components/field-tasks";

export default function TasksReportPage() {
  return (
    <>
      <PageHeader eyebrow="Reports · My Tasks" title="My Tasks" description="Tasks assigned to you by your manager or admin." />
      <FieldTasks />
    </>
  );
}
