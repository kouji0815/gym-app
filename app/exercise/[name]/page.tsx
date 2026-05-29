import Charts from "@/components/Charts";
import Link from "next/link";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const exercise = decodeURIComponent(name);

  return (
    <main>
      <Link href="/">
        <button className="btn btn-secondary">← ホームに戻る</button>
      </Link>
      <h1 style={{ marginTop: 16 }}>{exercise}</h1>
      <Charts exercise={exercise} />
    </main>
  );
}
