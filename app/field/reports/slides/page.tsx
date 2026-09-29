import { PageHeader } from "@/components/page-components";
import { FieldSlides } from "@/components/field-slides";

export default function SlidesReportPage() {
  return (
    <>
      <PageHeader eyebrow="Reports · My Slides" title="E-Detailing Slides" description="Browse and view slide materials uploaded by Admin." />
      <FieldSlides />
    </>
  );
}
