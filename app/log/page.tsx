import Link from "next/link";
import WorkoutForm from "@/components/WorkoutForm";

/**
 * 记录页面
 * 保存成功后会自动跳回首页
 */
export default function LogPage() {
  return (
    <main>
      <Link href="/">
        <button className="btn-secondary">← 返回首页</button>
      </Link>

      <div style={{ marginTop: 20 }}>
        <WorkoutForm />
      </div>
    </main>
  );
}
