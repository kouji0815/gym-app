import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import type { WorkoutCreateInput } from "@/lib/types";

// 数値チェックのヘルパー
function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

// 日付フォーマットのバリデーション
function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * POST /api/workouts
 * トレーニング記録の新規保存
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as WorkoutCreateInput;

    const date = body?.date?.trim();
    const exercise = body?.exercise?.trim();
    const notes = (body as any)?.notes?.trim() || null;
    const sets = Array.isArray(body?.sets) ? body.sets : [];

    // バリデーションチェック
    if (!date || !isValidDate(date)) {
      return NextResponse.json({ error: "日付の形式が正しくありません" }, { status: 400 });
    }
    if (!exercise) {
      return NextResponse.json({ error: "種目名を入力してください" }, { status: 400 });
    }
    if (sets.length === 0) {
      return NextResponse.json({ error: "セット情報を1つ以上入力してください" }, { status: 400 });
    }

    for (const s of sets) {
      if (!isFiniteNumber((s as any).weight) || !isFiniteNumber((s as any).reps)) {
        return NextResponse.json({ error: "重量または回数の値が不正です" }, { status: 400 });
      }
    }

    // Prismaを使用したリレーション保存
    const newWorkout = await prisma.workout.create({
      data: {
        date,
        exercise,
        notes,
        sets: {
          create: sets.map((s, i) => ({
            setIndex: i + 1,
            weight: (s as any).weight,
            reps: (s as any).reps,
          })),
        },
      },
    });

    return NextResponse.json({ ok: true, id: newWorkout.id }, { status: 201 });
  } catch (e) {
    console.error("保存エラー:", e);
    return NextResponse.json({ error: "データの保存に失敗しました" }, { status: 500 });
  }
}

/**
 * GET /api/workouts
 * 履歴の取得（種目・期間フィルタ付き）
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const exercise = url.searchParams.get("exercise")?.trim() || "";
    const from = url.searchParams.get("from")?.trim() || "";
    const to = url.searchParams.get("to")?.trim() || "";

    const where: any = {};
    if (exercise) where.exercise = { contains: exercise };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lte = to;
    }

    const workouts = await prisma.workout.findMany({
      where,
      include: {
        sets: { orderBy: { setIndex: 'asc' } }
      },
      orderBy: [
        { date: 'desc' },
        { id: 'desc' }
      ]
    });

    return NextResponse.json({ workouts });
  } catch (e) {
    console.error("取得エラー:", e);
    return NextResponse.json({ error: "データの読み込みに失敗しました" }, { status: 500 });
  }
}

/**
 * PUT /api/workouts?id=xxx
 * 記録の更新（セットを全削除→再作成）
 */
export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!id || id < 1) return NextResponse.json({ error: "無効なIDです" }, { status: 400 });

    const body = await req.json();
    const date = body?.date?.trim();
    const exercise = body?.exercise?.trim();
    const notes = body?.notes?.trim() || null;
    const sets = Array.isArray(body?.sets) ? body.sets : [];

    if (!date || !isValidDate(date)) return NextResponse.json({ error: "日付の形式が正しくありません" }, { status: 400 });
    if (!exercise) return NextResponse.json({ error: "種目名を入力してください" }, { status: 400 });
    if (sets.length === 0) return NextResponse.json({ error: "セット情報を1つ以上入力してください" }, { status: 400 });

    await prisma.$transaction([
      prisma.workoutSet.deleteMany({ where: { workoutId: id } }),
      prisma.workout.update({
        where: { id },
        data: {
          date,
          exercise,
          notes,
          sets: {
            create: sets.map((s: { weight: number; reps: number }, i: number) => ({
              setIndex: i + 1,
              weight: Number(s.weight),
              reps: Number(s.reps),
            })),
          },
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("更新エラー:", e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

/**
 * DELETE /api/workouts?id=xxx
 * 履歴の削除
 */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));

    if (!id || id < 1) {
      return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    }

    await prisma.workout.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("削除エラー:", e);
    return NextResponse.json({ error: "データの削除に失敗しました" }, { status: 500 });
  }
}