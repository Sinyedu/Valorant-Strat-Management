import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db/mongoose";

/** Pings MongoDB. Returns 503 if it is unreachable or unconfigured. */
export async function GET() {
  try {
    const { connection } = await connectToDatabase();
    await connection.db?.admin().ping();
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch {
    return NextResponse.json(
      { status: "error", database: "unavailable" },
      { status: 503 },
    );
  }
}
