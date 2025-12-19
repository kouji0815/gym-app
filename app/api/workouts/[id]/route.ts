import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";

type Params = { id: string };
type Ctx = { params: Promise<Params> };

// GET /api/workouts/[id]
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params; // ✅ Next16: params 是 Promise
  const numId = Number(id);

  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const row = db.prepare("SELECT * FROM workouts WHERE id = ?").get(numId);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(row);
}

// DELETE /api/workouts/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const numId = Number(id);

  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const info = db.prepare("DELETE FROM workouts WHERE id = ?").run(numId);
  return NextResponse.json({ ok: true, changes: info.changes });
}
