import { PageHeader } from "@/components/page-components";
import { FieldInventoryDetail } from "@/components/field-inventory-detail";

export default async function MasterInventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <PageHeader eyebrow="Master · Inventory" title="Receive Dispatch" description="Review each item's dispatch and received quantity, then submit." />
      <FieldInventoryDetail dispatchId={id} />
    </>
  );
}
