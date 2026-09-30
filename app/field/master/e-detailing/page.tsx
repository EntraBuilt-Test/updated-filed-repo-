import { PageHeader } from "@/components/page-components";
import { FieldEDetailingDownload } from "@/components/field-edetailing-download";

export default function MasterEDetailingPage() {
  return (
    <>
      <PageHeader eyebrow="Master · E-Detailing Download" title="E-Detailing Download" description="Browse slide materials uploaded by Admin by brand, and download for offline practice." />
      <FieldEDetailingDownload />
    </>
  );
}
