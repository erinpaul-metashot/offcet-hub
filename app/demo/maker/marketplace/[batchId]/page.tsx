"use client";

import { useParams } from "next/navigation";
import { MarketplaceLotDetail } from "../../../_components/marketplace-lot-detail";

export default function MakerMarketplaceLotPage() {
  const params = useParams<{ batchId: string }>();

  return (
    <MarketplaceLotDetail
      role="maker"
      batchId={params.batchId}
      backHref="/demo/maker/marketplace"
    />
  );
}
