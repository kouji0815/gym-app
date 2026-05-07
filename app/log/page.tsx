import Link from "next/link";
import WorkoutForm from "@/components/WorkoutForm";

/**
 * トレーニング記録ページ
 * 保存完了後、自動的にトップページへ戻ります
 */
export default function LogPage() {
  return (
    <main className="container mx-auto p-4">
      {/* 首页跳转按钮 */}
      <Link href="/">
        <button className="btn-secondary mb-6">
          ← ホームに戻る
        </button>
      </Link>

      <h1 className="text-2xl font-bold mb-4">新規ワークアウト記録</h1>

      <div className="mt-5">
        <WorkoutForm />
      </div>
    </main>
  );
}