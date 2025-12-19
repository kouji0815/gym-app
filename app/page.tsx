"use client";

import Link from "next/link";
import { useState } from "react";
import Filters from "@/components/Filters";
import Charts from "@/components/Charts";

/**
 * 首页
 * - 绿色按钮进入记录页面
 * - 下方显示趋势图和记录列表
 */
export default function HomePage() {
  const [exercise, setExercise] = useState("");

  return (
    <main>
      <h1>健身记录</h1>

      <Link href="/log">
        <button className="btn-primary" style={{ width: "100%" }}>
          ＋ 进入记录页面
        </button>
      </Link>

      <div style={{ marginTop: 20 }}>
        <Filters exercise={exercise} setExercise={setExercise} />
        <Charts exercise={exercise} />
      </div>
    </main>
  );
}
