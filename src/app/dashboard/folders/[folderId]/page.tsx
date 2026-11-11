import { Suspense } from "react";
import { FolderView } from "@/components/folder-view";

export const metadata = { title: "Folder — Stratbook" };

async function FolderContent({
  params,
}: {
  params: PageProps<"/dashboard/folders/[folderId]">["params"];
}) {
  const { folderId } = await params;
  return <FolderView folderId={folderId} />;
}

export default function FolderPage({
  params,
}: PageProps<"/dashboard/folders/[folderId]">) {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-muted">Loading…</p>}>
      <FolderContent params={params} />
    </Suspense>
  );
}
