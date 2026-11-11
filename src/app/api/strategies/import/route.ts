import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { MAX_IMAGE_BYTES } from "@/server/import/image";
import { ImportError } from "@/server/import/types";
import { importImages, MAX_FILES_PER_IMPORT } from "@/server/services/strategy-import";

const MAX_BODY_BYTES = MAX_FILES_PER_IMPORT * MAX_IMAGE_BYTES + 1024 * 1024;

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

/** Same-origin check on top of SameSite cookies: reject cross-site form posts. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients have no Origin; they still need the session cookie
  return new URL(origin).host === request.headers.get("host");
}

export async function POST(request: Request) {
  const session = await auth();
  const workspaceId = session?.user?.workspaceId;
  if (!session?.user?.id || !workspaceId) return fail("Not signed in", 401);
  if (!sameOrigin(request)) return fail("Forbidden", 403);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return fail("Upload is too large", 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Invalid upload", 400);
  }

  const entries = form.getAll("files").filter((v): v is File => v instanceof File);
  if (entries.some((f) => f.size > MAX_IMAGE_BYTES)) {
    return fail(`Each file must be at most ${MAX_IMAGE_BYTES / 1024 / 1024} MB`, 413);
  }

  try {
    const files = await Promise.all(
      entries.map(async (f) => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })),
    );
    const folder = String(form.get("folderId") ?? "");
    const strategyIds = await importImages(workspaceId, {
      folderId: folder === "" ? null : folder,
      source: String(form.get("source") ?? ""),
      group: form.get("group") === "true",
      files,
    });
    return NextResponse.json({ strategyIds });
  } catch (e) {
    if (e instanceof ImportError) return fail(e.message, 400);
    console.error("Import failed");
    return fail("Could not save the upload. Try again.", 500);
  }
}
