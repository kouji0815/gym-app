import { NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = db
      .prepare(
        `SELECT exercise, COUNT(*) as cnt
         FROM workouts
         GROUP BY exercise
         ORDER BY cnt DESC, exercise ASC`
      )
      .all();

    return NextResponse.json({
      exercises: rows.map((r: any) => r.exercise),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to load exercises" }, { status: 500 });
  }
}
