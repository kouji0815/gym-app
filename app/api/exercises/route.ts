import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const workouts = await prisma.workout.findMany({
      include: { 
        sets: { orderBy: { setIndex: 'asc' } } 
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(workouts);
  } catch (e) {
    console.error("GETエラー:", e);
    return NextResponse.json({ error: "データの取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, exercise, sets } = body;

    const newWorkout = await prisma.workout.create({
      data: {
        // 将前端传来的字符串（"2026-05-07"）转为 Prisma 要求的 Date 对象
       date: new Date(date).toISOString().split('T')[0],
        exercise,
        sets: {
          create: sets.map((s: any, index: number) => ({
            weight: parseFloat(s.weight),
            reps: parseInt(s.reps),
            setIndex: index
          }))
        }
      }
    });
    return NextResponse.json(newWorkout);
  } catch (e) {
    console.error("POSTエラー:", e);
    return NextResponse.json({ error: "データの保存に失敗しました" }, { status: 500 });
  }
}