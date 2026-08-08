"use client";

import { useParams } from "next/navigation";
import { listBrandProjects } from "../../../_mock/selectors-brand";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import { MarketplaceLotDetail } from "../../../_components/marketplace-lot-detail";

export default function BrandMarketplaceLotPage() {
  const params = useParams<{ batchId: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("brand");

  return (
    <MarketplaceLotDetail
      role="brand"
      batchId={params.batchId}
      backHref="/demo/brand/marketplace"
      projects={listBrandProjects(db, scope.orgId).filter(
        (project) => project.status === "active",
      )}
    />
  );
}
