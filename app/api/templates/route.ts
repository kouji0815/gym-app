import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      include: { sets: { orderBy: { setIndex: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ templates });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = body?.name?.trim();
    const exercise = body?.exercise?.trim();
    const sets = Array.isArray(body?.sets) ? body.sets : [];

    if (!name) return NextResponse.json({ error: "テンプレート名を入力してください" }, { status: 400 });
    if (!exercise) return NextResponse.json({ error: "種目名を入力してください" }, { status: 400 });
    if (sets.length === 0) return NextResponse.json({ error: "セットを1つ以上入力してください" }, { status: 400 });

    const template = await prisma.template.create({
      data: {
        name,
        exercise,
        sets: {
          create: sets.map((s: { weight: number; reps: number }, i: number) => ({
            setIndex: i + 1,
            weight: Number(s.weight),
            reps: Number(s.reps),
          })),
        },
      },
    });

    return NextResponse.json({ ok: true, id: template.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!id || id < 1) return NextResponse.json({ error: "無効なIDです" }, { status: 400 });

    await prisma.template.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
