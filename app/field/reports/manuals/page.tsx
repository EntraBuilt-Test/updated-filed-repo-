import { PageHeader } from "@/components/page-components";
import { FieldManuals } from "@/components/field-manuals";

export default function ManualsReportPage() {
  return (
    <>
      <PageHeader eyebrow="Reports · Manuals" title="Manuals" description="Reference documents uploaded by Admin." />
      <FieldManuals />
    </>
  );
}
