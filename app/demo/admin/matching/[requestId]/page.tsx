"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { MatchingWorkspaceView } from "../../../_components/matching-workspace";
import { getMatchingWorkspace } from "../../../_mock/selectors-admin";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";

export default function MatchingWorkspacePage() {
  const params = useParams<{ requestId: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("admin");
  const workspace = getMatchingWorkspace(db, scope, params.requestId);

  if (!workspace) {
    return <EmptyState title="Request not found" body="The demo data may have been reset." />;
  }

  return <MatchingWorkspaceView workspace={workspace} />;
}
