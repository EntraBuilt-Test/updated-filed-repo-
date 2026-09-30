"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/page-components";
import { ChemistCallScreen } from "@/components/chemist-call-screen";

export default function ChemistCallPage() {
  return (
    <Suspense fallback={null}>
      <PageHeader eyebrow="Chemist Call" title="Chemist Call" description="RCPA, POB, Short Expiry and JCC for this chemist visit." />
      <ChemistCallScreen />
    </Suspense>
  );
}
