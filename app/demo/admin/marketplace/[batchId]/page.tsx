"use client";

import { useParams } from "next/navigation";
import { MarketplaceLotDetail } from "../../../_components/marketplace-lot-detail";

export default function AdminMarketplaceLotPage() {
  const params = useParams<{ batchId: string }>();

  return (
    <MarketplaceLotDetail
      role="admin"
      batchId={params.batchId}
      backHref="/demo/admin/marketplace"
    />
  );
}
