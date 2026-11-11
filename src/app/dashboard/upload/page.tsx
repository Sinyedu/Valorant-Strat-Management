import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/server/session";
import { getFolder } from "@/server/services/folders";
import { objectIdSchema } from "@/lib/validation/folder";
import { UploadForm } from "@/components/upload-form";

export const metadata = { title: "Upload — Stratbook" };

async function UploadContent({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard/upload">["searchParams"];
}) {
  const { workspaceId } = await requireSession();
  const raw = (await searchParams).folderId;
  const folderId = typeof raw === "string" && raw !== "" ? raw : null;

  let folderName = "Playbooks";
  if (folderId) {
    if (!objectIdSchema.safeParse(folderId).success) notFound();
    const folder = await getFolder(workspaceId, folderId);
    if (!folder) notFound();
    folderName = folder.name;
  }
  const back = folderId ? `/dashboard/folders/${folderId}` : "/dashboard";

  return (
    <>
      <Link href={back} className="text-sm text-muted hover:text-foreground">
        ← {folderName}
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Upload strategies</h1>
      <p className="mt-1 text-sm text-muted">Saving to: {folderName}. No title needed; the filename is used.</p>
      <div className="mt-6">
        <UploadForm folderId={folderId} />
      </div>
    </>
  );
}

export default function UploadPage(props: PageProps<"/dashboard/upload">) {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-muted">Loading…</p>}>
      <UploadContent searchParams={props.searchParams} />
    </Suspense>
  );
}
