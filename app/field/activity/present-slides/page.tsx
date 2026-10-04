import { PageHeader } from "@/components/page-components";
import { FieldPresentSlides } from "@/components/field-present-slides";

export default function ActivityPresentSlidesPage() {
  return (
    <>
      <PageHeader eyebrow="My Activity · Present Slides" title="Present Slides" description="Show a brand's slides to a listed doctor and log the time on screen." />
      <FieldPresentSlides />
    </>
  );
}
