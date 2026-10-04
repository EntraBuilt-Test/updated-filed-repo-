import { PageHeader } from "@/components/page-components";
import { FieldRcpaCrmScreen } from "@/components/field-rcpa-crm";

export default function RcpaCrmPage() {
  return (
    <>
      <PageHeader eyebrow="Reports · RCPA, CRM" title="RCPA, CRM and Supportive Chemists" description="Record competitor Rx counts, CRM given to doctors, and each doctor's supportive chemists." />
      <FieldRcpaCrmScreen />
    </>
  );
}
