import { Suspense } from "react";
import { FolderView } from "@/components/folder-view";

export const metadata = { title: "Dashboard — Stratbook" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-muted">Loading…</p>}>
      <FolderView folderId={null} />
    </Suspense>
  );
}
