"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { MatchingWorkspaceView } from "../../../_components/matching-workspace";
import { getMatchingWorkspace } from "../../../_mock/selectors-admin";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";

export default function MatchingWorkspacePage() {
  const params = useParams<{ requestId: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("admin");
  const workspace = getMatchingWorkspace(db, scope, params.requestId);
  const { requests: t } = useMessages(demoAdmin);

  if (!workspace) {
    return <EmptyState title={t.notFound} />;
  }

  return <MatchingWorkspaceView workspace={workspace} />;
}
