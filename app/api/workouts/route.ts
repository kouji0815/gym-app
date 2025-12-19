import { NextResponse } from "next/server";
import db from "@/lib/db";
import type { WorkoutCreateInput } from "@/lib/types";

// ★重要：better-sqlite3 は Node.js でしか動かないので明示する
export const runtime = "nodejs";

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * POST /api/workouts
 * 1回のトレーニング（同日・同種目） + 複数セットを保存
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as WorkoutCreateInput;

    const date = body?.date?.trim();
    const exercise = body?.exercise?.trim();
    const notes = (body as any)?.notes?.trim() ? (body as any).notes.trim() : null;
    const sets = Array.isArray(body?.sets) ? body.sets : [];

    if (!date || !isValidDate(date)) {
      return NextResponse.json({ error: "日付が不正です" }, { status: 400 });
    }
    if (!exercise) {
      return NextResponse.json({ error: "種目名が必要です" }, { status: 400 });
    }
    if (sets.length === 0) {
      return NextResponse.json({ error: "セットを1つ以上入力してください" }, { status: 400 });
    }

    // ここで厳密チェック（空文字 → 0 の事故を防ぐのはフロント側が主だが、APIでも守る）
    for (const s of sets) {
      if (!isFiniteNumber((s as any).weight) || !isFiniteNumber((s as any).reps)) {
        return NextResponse.json({ error: "重量/回数が不正です" }, { status: 400 });
      }
      if ((s as any).weight < 0 || (s as any).reps <= 0) {
        return NextResponse.json({ error: "重量/回数の範囲が不正です" }, { status: 400 });
      }
    }

    const insertWorkout = db.prepare(
      `INSERT INTO workouts (date, exercise, notes) VALUES (?, ?, ?)`
    );
    const insertSet = db.prepare(
      `INSERT INTO workout_sets (workout_id, set_index, weight, reps)
       VALUES (?, ?, ?, ?)`
    );

    const tx = db.transaction(() => {
      const info = insertWorkout.run(date, exercise, notes);
      const workoutId = Number(info.lastInsertRowid);

      sets.forEach((s, i) => {
        insertSet.run(workoutId, i + 1, (s as any).weight, (s as any).reps);
      });

      return workoutId;
    });

    const id = tx();
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    console.error("POST /api/workouts error:", e);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}

/**
 * GET /api/workouts
 * クエリ：
 * - exercise（任意, 部分一致）
 * - from（任意, YYYY-MM-DD）
 * - to（任意, YYYY-MM-DD）
 * 返却：workouts + sets
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const exercise = url.searchParams.get("exercise")?.trim() || "";
    const from = url.searchParams.get("from")?.trim() || "";
    const to = url.searchParams.get("to")?.trim() || "";

    const where: string[] = [];
    const params: any[] = [];

    if (exercise) {
      where.push("w.exercise LIKE ?");
      params.push(`%${exercise}%`);
    }
    if (from) {
      if (!isValidDate(from)) {
        return NextResponse.json({ error: "from が不正です" }, { status: 400 });
      }
      where.push("w.date >= ?");
      params.push(from);
    }
    if (to) {
      if (!isValidDate(to)) {
        return NextResponse.json({ error: "to が不正です" }, { status: 400 });
      }
      where.push("w.date <= ?");
      params.push(to);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // 新しい順の方が一覧として自然（必要なら ASC に戻してOK）
    const workouts = db
      .prepare(
        `SELECT w.*
         FROM workouts w
         ${whereSql}
         ORDER BY w.date DESC, w.id DESC`
      )
      .all(...params) as any[];

    const setStmt = db.prepare(
      `SELECT set_index, weight, reps
       FROM workout_sets
       WHERE workout_id = ?
       ORDER BY set_index ASC`
    );

    const result = workouts.map((w) => ({
      ...w,
      sets: setStmt.all(w.id),
    }));

    return NextResponse.json({ workouts: result });
  } catch (e) {
    console.error("GET /api/workouts error:", e);
    return NextResponse.json({ error: "読み込みに失敗しました" }, { status: 500 });
  }
}

/**
 * DELETE /api/workouts?id=123
 * - 1件削除（workout_sets → workouts の順）
 */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const idStr = url.searchParams.get("id")?.trim() || "";

    const id = Number(idStr);
    if (!idStr || !Number.isFinite(id) || id < 1) {
      return NextResponse.json({ error: "id が不正です" }, { status: 400 });
    }

    const delSets = db.prepare(`DELETE FROM workout_sets WHERE workout_id = ?`);
    const delWorkout = db.prepare(`DELETE FROM workouts WHERE id = ?`);

    const tx = db.transaction(() => {
      delSets.run(id);
      const info = delWorkout.run(id);
      return info.changes; // 0 or 1
    });

    const changes = tx();
    if (!changes) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/workouts error:", e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
