import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const exercise = url.searchParams.get("exercise") || "";
    const where: { exercise?: { contains: string } } = {};
    if (exercise) where.exercise = { contains: exercise };

    const workouts = await prisma.workout.findMany({
      where,
      include: { sets: { orderBy: { setIndex: "asc" } } },
      orderBy: [{ date: "desc" }, { id: "desc" }],
    });

    const rows = ["日付,種目,セット,重量(kg),回数,メモ"];
    for (const w of workouts) {
      for (const s of w.sets) {
        const notes = (w.notes ?? "").replace(/,/g, "、");
        rows.push(`${w.date},${w.exercise},${s.setIndex},${s.weight},${s.reps},${notes}`);
      }
    }
    const csv = "﻿" + rows.join("\n"); // BOM付きUTF-8（Excelで文字化けしない）

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gym-log-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "エクスポート失敗" }), { status: 500 });
  }
}
