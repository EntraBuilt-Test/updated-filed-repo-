import { PageHeader } from "@/components/page-components";
import { FieldCirculars } from "@/components/field-circulars";

export default function CircularsReportPage() {
  return (
    <>
      <PageHeader eyebrow="Reports - Circulars" title="Circulars" description="Files Admin sent to your designation." />
      <FieldCirculars />
    </>
  );
}
