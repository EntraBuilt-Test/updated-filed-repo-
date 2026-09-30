import { PageHeader } from "@/components/page-components";
import { FieldEDetailingPractice } from "@/components/field-edetailing-practice";

export default function ActivityEDetailingPracticePage() {
  return (
    <>
      <PageHeader eyebrow="My Activity · E-Detailing Practice" title="E-Detailing Practice" description="Slides you've downloaded for offline practice." />
      <FieldEDetailingPractice />
    </>
  );
}
