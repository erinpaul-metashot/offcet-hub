"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { ProjectDetailView } from "../../../_components/project-detail";
import { getProjectProofView } from "../../../_mock/selectors-brand";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";

export default function AdminProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("admin");
  const proof = getProjectProofView(db, scope, params.id);
  const { projects: t } = useMessages(demoAdmin);

  if (!proof) {
    return <EmptyState title={t.notFound} />;
  }

  return <ProjectDetailView proof={proof} backHref="/demo/admin/projects" />;
}
