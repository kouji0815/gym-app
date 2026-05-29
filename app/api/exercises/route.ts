import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/exercises — returns list of distinct exercise names
export async function GET() {
  try {
    const rows = await prisma.workout.findMany({
      select: { exercise: true },
      distinct: ["exercise"],
      orderBy: { exercise: "asc" },
    });
    return NextResponse.json({ exercises: rows.map((r) => r.exercise) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得失敗" }, { status: 500 });
  }
}
