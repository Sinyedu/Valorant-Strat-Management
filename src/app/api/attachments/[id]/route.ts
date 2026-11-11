import { connection } from "next/server";
import { auth } from "@/auth";
import { getAttachmentFile } from "@/server/services/strategies";

const INLINE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/** Content-Disposition with an ASCII fallback plus an RFC 5987 UTF-8 name. */
function disposition(kind: "inline" | "attachment", name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]|["\\;]/g, "_");
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/attachments/[id]">,
) {
  await connection(); // per-request: depends on the session cookie
  const session = await auth();
  const workspaceId = session?.user?.workspaceId;
  if (!session?.user?.id || !workspaceId) {
    return new Response("Not signed in", { status: 401 });
  }

  const { id } = await ctx.params;
  const file = await getAttachmentFile(workspaceId, id);
  if (!file) return new Response("Not found", { status: 404 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  const inline = !download && INLINE_TYPES.has(file.contentType);
  return new Response(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.bytes.length),
      "Content-Disposition": disposition(inline ? "inline" : "attachment", file.originalName),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, max-age=300",
    },
  });
}
