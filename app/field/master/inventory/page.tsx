import { PageHeader } from "@/components/page-components";
import { FieldInventory } from "@/components/field-inventory";

export default function MasterInventoryPage() {
  return (
    <>
      <PageHeader eyebrow="Master · Inventory" title="Inventory" description="Receive Sample/Input dispatches and track your available stock." />
      <FieldInventory />
    </>
  );
}
