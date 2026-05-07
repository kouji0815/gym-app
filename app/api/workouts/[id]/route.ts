import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 使用 Prisma 从 TiDB 获取所有数据
    const workouts = await prisma.workout.findMany({
      include: { sets: true },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(workouts);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "データ取得失敗" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, exercise, sets } = body;

    const newWorkout = await prisma.workout.create({
      data: {
        date: new Date(date).toISOString().split('T')[0],
        exercise,
        sets: {
          create: sets.map((s: any, index: number) => ({
            weight: s.weight,
            reps: s.reps,
            setIndex: index
          }))
        }
      }
    });
    return NextResponse.json(newWorkout);
  } catch (e) {
    return NextResponse.json({ error: "保存失敗" }, { status: 500 });
  }
}