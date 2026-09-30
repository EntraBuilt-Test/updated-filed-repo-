import { PageHeader } from "@/components/page-components";
import { FieldCoverage } from "@/components/field-coverage";

export default function CoverageReportPage() {
  return (
    <>
      <PageHeader eyebrow="Reports · My Coverage" title="My Coverage" description="Your own doctor coverage and call-average stats by territory type." />
      <FieldCoverage />
    </>
  );
}
