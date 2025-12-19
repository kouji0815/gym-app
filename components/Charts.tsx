"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * 趋势显示（折线图）
 * - 只显示「单次最大重量（Top set）」
 * - 不显示总训练容量（Volume）
 * - 列表中也不显示「Volume / Top」行
 */

type Workout = {
  id: number;
  date: string;
  exercise: string;
  notes: string | null;
  sets: { set_index: number; weight: number; reps: number }[];
};

function calcTopWeight(w: Workout) {
  return w.sets.reduce((mx, s) => Math.max(mx, s.weight), 0);
}

export default function Charts({ exercise }: { exercise: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (exercise) qs.set("exercise", exercise);

      const res = await fetch(`/api/workouts?${qs.toString()}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.error ?? "读取数据失败");
        return;
      }

      setWorkouts(Array.isArray(json?.workouts) ? json.workouts : []);
    } catch (e) {
      console.error(e);
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise]);

  // 按日期只统计「Top set」
  // 如果同一天有多条记录，则取当天最大重量
  const trend = useMemo(() => {
    const map = new Map<string, { date: string; topWeight: number }>();

    for (const w of workouts) {
      const top = calcTopWeight(w);
      const cur = map.get(w.date);

      if (!cur) {
        map.set(w.date, { date: w.date, topWeight: top });
      } else {
        cur.topWeight = Math.max(cur.topWeight, top);
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [workouts]);

  const summary = useMemo(() => {
    const totalSessions = workouts.length;
    const maxTop = workouts.reduce(
      (mx, w) => Math.max(mx, calcTopWeight(w)),
      0
    );
    return { totalSessions, maxTop };
  }, [workouts]);

  return (
    <section className="card mt-16">
      <div className="card-head">
        <div>
          <h2 className="h2">训练趋势</h2>
          <p className="muted">
            {exercise ? `训练动作：${exercise}` : "训练动作：全部"}
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={load}
          disabled={loading}
        >
          {loading ? "刷新中…" : "刷新"}
        </button>
      </div>

      {error ? <div className="error">{error}</div> : null}

      {/* 不显示总训练容量（用户需求） */}
      <div className="stats">
        <div className="stat">
          <div className="stat-label">训练次数</div>
          <div className="stat-value">{summary.totalSessions}</div>
        </div>
        <div className="stat">
          <div className="stat-label">最高重量（Top set）</div>
          <div className="stat-value">{summary.maxTop.toFixed(1)} kg</div>
        </div>
      </div>

      {trend.length === 0 ? (
        <div className="empty">
          还没有记录，点击「进入记录页面」开始训练记录
        </div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid />
              <XAxis dataKey="date" />
              {/* Y 轴只显示 Top set（kg） */}
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="topWeight"
                name="Top set (kg)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 列表中不显示 Volume / Top 行 */}
      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {workouts.map((w) => (
          <div
            key={w.id}
            style={{
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 18,
              padding: 14,
              background: "rgba(255,255,255,0.9)",
            }}
          >
            <div style={{ fontWeight: 900 }}>
              {w.date} / {w.exercise}
            </div>

            {w.notes ? (
              <div style={{ color: "#444", marginTop: 6 }}>
                备注：{w.notes}
              </div>
            ) : null}

            <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
              {w.sets.map((s) => (
                <div key={s.set_index} style={{ color: "#222" }}>
                  第 {s.set_index} 组：{s.weight} kg × {s.reps} 次
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
