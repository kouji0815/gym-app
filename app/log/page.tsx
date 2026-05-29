import Link from "next/link";
import WorkoutForm from "@/components/WorkoutForm";

export default function LogPage() {
  return (
    <main>
      <Link href="/">
        <button className="btn btn-secondary">← ホームに戻る</button>
      </Link>
      <h1 style={{ marginTop: 16 }}>新規ワークアウト記録</h1>
      <div style={{ marginTop: 16 }}>
        <WorkoutForm />
      </div>
    </main>
  );
}
