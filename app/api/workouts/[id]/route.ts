import { NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  try {
    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const tx = db.transaction(() => {
      db.prepare(`DELETE FROM workout_sets WHERE workout_id = ?`).run(id);
      const info = db.prepare(`DELETE FROM workouts WHERE id = ?`).run(id);
      return info.changes;
    });

    const changes = tx();
    return NextResponse.json({ ok: true, deleted: changes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to delete" }, { status: 500 });
  }
}
