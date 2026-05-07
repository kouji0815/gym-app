"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutCreateInput } from "@/lib/types";

/**
 * 训练记录表单
 * - 重量 / 回数 / セット 只输入一次
 * - 提交时自动展开为多组
 * - 输入过程允许删空（string 管理）
 */
export default function WorkoutForm() {
  const router = useRouter();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [exercise, setExercise] = useState("");

  // 🔑 只保留 3 个输入（全部 string，允许删空）
  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [setCount, setSetCount] = useState<string>("");

  async function submit() {
    const w = Number(weight);
    const r = Number(reps);
    const cRaw = Number(setCount);
    const c = Math.floor(cRaw);

    if (!exercise.trim()) {
      alert("種目");
      return;
    }

    if (
      weight === "" ||
      reps === "" ||
      setCount === "" ||
      !Number.isFinite(w) ||
      !Number.isFinite(r) ||
      !Number.isFinite(cRaw) ||
      w < 0 ||
      r < 1 ||
      c < 1
    ) {
      alert("正しい重量、回数、セットを入力");
      return;
    }

    // ✅ 自动展开为多组（用户无感）
    const sets = Array.from({ length: c }, (_, i) => ({
      set_index: i + 1,
      weight: w,
      reps: r,
    }));

    const payload: WorkoutCreateInput = {
      date,
      exercise: exercise.trim(),
      sets,
    };

    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("保存失敗");
        return;
      }

      router.push("/");
    } catch {
      alert("ネットワークエラー");
    }
  }

  return (
    <div className="card">
      <h2 className="h2">記録</h2>
      <p className="muted">

      </p>

      <div className="mt-16 form-grid">
        <label>
          種目名
          <input
            placeholder="例如：Bench Press"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
          />
        </label>

        <label>
          日付
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      {/* ===== iOS 风格输入卡片 ===== */}
      <div className="ios-card mt-16">
        {/* 重さ */}
        <div className="ios-row">
          <div className="ios-label">重量</div>
          <div className="ios-right">
            <div className="with-unit">
              <input
                className="unit-input"
                type="number"
                placeholder="---"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <span className="unit-suffix">kg</span>
            </div>
          </div>
        </div>

        <div className="ios-divider" />

        {/* 回数 */}
        <div className="ios-row">
          <div className="ios-label">回数</div>
          <div className="ios-right">
            <div className="with-unit">
              <input
                className="unit-input"
                type="number"
                placeholder="---"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
              <span className="unit-suffix">回</span>
            </div>
          </div>
        </div>

        <div className="ios-divider" />

        {/* セット */}
        <div className="ios-row">
          <div className="ios-label">セット数</div>
          <div className="ios-right">
            <div className="with-unit">
              <input
                className="unit-input"
                type="number"
                placeholder="---"
                value={setCount}
                onChange={(e) => setSetCount(e.target.value)}
              />
              <span className="unit-suffix">セット</span>
            </div>
          </div>
        </div>
      </div>

      <button className="btn btn-primary mt-16" onClick={submit}>
        記録
      </button>
    </div>
  );
}
