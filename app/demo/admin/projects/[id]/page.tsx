"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { ProjectDetailView } from "../../../_components/project-detail";
import { getProjectProofView } from "../../../_mock/selectors-brand";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";

export default function AdminProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("admin");
  const proof = getProjectProofView(db, scope, params.id);

  if (!proof) {
    return <EmptyState title="Project not found" body="The demo data may have been reset." />;
  }

  return <ProjectDetailView proof={proof} backHref="/demo/admin/projects" />;
}
