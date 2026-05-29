"use client";

import Link from "next/link";
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
import { calcOneRM, calcVolume, thisWeekDays } from "@/lib/utils";

type WorkoutSet = { setIndex: number; weight: number; reps: number };
type Workout = {
  id: number;
  date: string;
  exercise: string;
  notes: string | null;
  sets: WorkoutSet[];
};
type SetRow = { weight: string; reps: string };

function calcTopWeight(w: Workout) {
  return w.sets.reduce((mx, s) => Math.max(mx, s.weight), 0);
}

function calcBestOneRM(w: Workout) {
  return w.sets.reduce((mx, s) => Math.max(mx, calcOneRM(s.weight, s.reps)), 0);
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function weekLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}週`;
}

function TrendArrow({ change }: { change: number | null }) {
  if (change === null) return <span className="trend-neutral">—</span>;
  if (change > 0) return <span className="trend-up">↑ +{change.toFixed(1)}</span>;
  if (change < 0) return <span className="trend-down">↓ {change.toFixed(1)}</span>;
  return <span className="trend-neutral">→ 0</span>;
}

// ──────────────── インライン編集カード ────────────────
function EditCard({
  workout,
  onSave,
  onCancel,
}: {
  workout: Workout;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(workout.date);
  const [exercise, setExercise] = useState(workout.exercise);
  const [notes, setNotes] = useState(workout.notes ?? "");
  const [sets, setSets] = useState<SetRow[]>(
    workout.sets.map((s) => ({ weight: String(s.weight), reps: String(s.reps) }))
  );

  function addSet() { setSets((p) => [...p, { weight: "", reps: "" }]); }
  function removeSet(i: number) { if (sets.length > 1) setSets((p) => p.filter((_, idx) => idx !== i)); }
  function updateSet(i: number, f: "weight" | "reps", v: string) {
    setSets((p) => p.map((s, idx) => idx === i ? { ...s, [f]: v } : s));
  }

  async function save() {
    for (const s of sets) {
      if (!s.weight || !s.reps || Number(s.weight) < 0 || Number(s.reps) < 1) {
        alert("全セットに正しい値を入力してください"); return;
      }
    }
    const payload = {
      date,
      exercise: exercise.trim(),
      notes: notes.trim() || undefined,
      sets: sets.map((s) => ({ weight: Number(s.weight), reps: Number(s.reps) })),
    };
    const res = await fetch(`/api/workouts?id=${workout.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { onSave(); }
    else { alert("保存失敗"); }
  }

  return (
    <div className="card-inner" style={{ border: "2px solid rgba(0,113,227,0.25)" }}>
      <div className="form-grid" style={{ marginBottom: 10 }}>
        <label>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>種目名</span>
          <input value={exercise} onChange={(e) => setExercise(e.target.value)} />
        </label>
        <label>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>日付</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      <label style={{ display: "grid", gap: 4, marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>メモ</span>
        <textarea className="notes-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <div className="ios-card" style={{ padding: "0 14px", marginBottom: 10 }}>
        {sets.map((s, i) => (
          <div key={i} className="set-row">
            <div className="set-row-num">第 {i + 1}</div>
            <input className="set-row-input" type="number" placeholder="重量" value={s.weight} onChange={(e) => updateSet(i, "weight", e.target.value)} />
            <span style={{ fontSize: 13, color: "var(--muted)" }}>kg</span>
            <input className="set-row-input" type="number" placeholder="回数" value={s.reps} onChange={(e) => updateSet(i, "reps", e.target.value)} />
            <span style={{ fontSize: 13, color: "var(--muted)" }}>回</span>
            <button className="delete-btn" style={{ width: 30, height: 30, fontSize: 13, marginLeft: "auto" }} onClick={() => removeSet(i)} disabled={sets.length === 1} aria-label="削除">🗑</button>
          </div>
        ))}
        <div style={{ padding: "8px 0" }}>
          <button className="btn btn-secondary" style={{ width: "100%", fontSize: 12 }} onClick={addSet}>＋ セット追加</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, fontSize: 13 }} onClick={save}>✅ 保存</button>
        <button className="btn btn-secondary" style={{ flex: 1, fontSize: 13 }} onClick={onCancel}>❌ キャンセル</button>
      </div>
    </div>
  );
}

// ──────────────── メインコンポーネント ────────────────
export default function Charts({ exercise }: { exercise: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (exercise) qs.set("exercise", exercise);
      const res = await fetch(`/api/workouts?${qs.toString()}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json?.error ?? "データ読み込み失敗"); return; }
      setWorkouts(Array.isArray(json?.workouts) ? json.workouts : []);
    } catch {
      setError("ネットワークエラー");
    } finally {
      setLoading(false);
    }
  }

  async function deleteWorkout(id: number) {
    if (!confirm("このレコードを削除しますか？")) return;
    const res = await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
    if (!res.ok) { alert("削除失敗"); return; }
    load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise]);

  // トレンドデータ（topWeight + volume）
  const trend = useMemo(() => {
    const map = new Map<string, { date: string; topWeight: number; volume: number }>();
    for (const w of workouts) {
      const top = calcTopWeight(w);
      const vol = calcVolume(w);
      const cur = map.get(w.date);
      if (!cur) {
        map.set(w.date, { date: w.date, topWeight: top, volume: vol });
      } else {
        cur.topWeight = Math.max(cur.topWeight, top);
        cur.volume += vol;
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [workouts]);

  // サマリー統計
  const summary = useMemo(() => {
    const maxTop = workouts.reduce((mx, w) => Math.max(mx, calcTopWeight(w)), 0);
    const bestOneRM = workouts.reduce((mx, w) => Math.max(mx, calcBestOneRM(w)), 0);
    const totalVolume = workouts.reduce((sum, w) => sum + calcVolume(w), 0);
    const weekDays = thisWeekDays(workouts);
    return { totalSessions: workouts.length, maxTop, bestOneRM, totalVolume, weekDays };
  }, [workouts]);

  // PRマップ（種目ごとの最高topWeight）
  const prMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of workouts) {
      const top = calcTopWeight(w);
      map.set(w.exercise, Math.max(map.get(w.exercise) ?? 0, top));
    }
    return map;
  }, [workouts]);

  // 週別テーブルデータ
  const weeklyRows = useMemo(() => {
    const weekMap = new Map<string, number>();
    for (const w of workouts) {
      const wk = getWeekStart(w.date);
      const top = calcTopWeight(w);
      weekMap.set(wk, Math.max(weekMap.get(wk) ?? 0, top));
    }
    const sorted = Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    return sorted
      .map(([week, maxWeight], i) => ({
        week,
        maxWeight,
        change: i > 0 ? maxWeight - sorted[i - 1][1] : null,
      }))
      .reverse();
  }, [workouts]);

  // 全種目サマリー（フィルターなし時）
  const exerciseSummary = useMemo(() => {
    if (exercise) return [];
    const exercises = [...new Set(workouts.map((w) => w.exercise))].sort();
    const now = new Date();
    const recentWeeks = [0, 1, 2, 3].map((n) => {
      const d = new Date(now);
      d.setDate(now.getDate() - 7 * n);
      return getWeekStart(d.toISOString().slice(0, 10));
    });
    return exercises.map((ex) => {
      const exW = workouts.filter((w) => w.exercise === ex);
      const weekMaxes = recentWeeks.map((wk) => {
        const hits = exW.filter((w) => getWeekStart(w.date) === wk);
        return hits.length > 0 ? Math.max(...hits.map(calcTopWeight)) : null;
      });
      return { exercise: ex, weekMaxes, recentWeeks };
    });
  }, [workouts, exercise]);

  // CSVエクスポートURL
  const csvUrl = `/api/workouts/export${exercise ? `?exercise=${encodeURIComponent(exercise)}` : ""}`;

  return (
    <section className="card mt-16">
      <div className="card-head">
        <div>
          <h2 className="h2">成長</h2>
          <p className="muted">{exercise ? `種目：${exercise}` : "全種目"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => window.open(csvUrl)}>
            📥 CSV
          </button>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            {loading ? "更新中…" : "更新"}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* サマリーカード */}
      <div className="stats stats-5">
        <div className="stat">
          <div className="stat-label">回数</div>
          <div className="stat-value">{summary.totalSessions}</div>
        </div>
        <div className="stat">
          <div className="stat-label">最高重量</div>
          <div className="stat-value">{summary.maxTop.toFixed(1)} kg</div>
        </div>
        <div className="stat">
          <div className="stat-label">推定1RM</div>
          <div className="stat-value">{summary.bestOneRM.toFixed(1)} kg</div>
        </div>
        <div className="stat">
          <div className="stat-label">今週</div>
          <div className="stat-value">
            {summary.weekDays}日{summary.weekDays > 0 ? " 🔥" : ""}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">合計ボリューム</div>
          <div className="stat-value">{summary.totalVolume.toFixed(0)} kg</div>
        </div>
      </div>

      {/* トレンドチャート */}
      {trend.length === 0 ? (
        <div className="empty">まだ記録がありません。「記録画面」を押してください</div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer>
            <LineChart data={trend} margin={{ top: 12, right: 56, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}kg`} width={52} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}kg`} width={56} />
              <Tooltip
                formatter={(v, name) => [
                  `${Number(v).toFixed(1)} kg`,
                  name === "topWeight" ? "Top set" : "ボリューム",
                ]}
                labelFormatter={(l) => `日付：${l}`}
              />
              <Line yAxisId="left" type="monotone" dataKey="topWeight" name="topWeight" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4, fill: "#16a34a" }} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="volume" name="volume" stroke="#0071e3" strokeWidth={2} dot={false} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 週別進歩テーブル（種目フィルター時） */}
      {exercise && weeklyRows.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 className="section-title">週別進歩</h3>
          <div className="week-table-wrap">
            <table className="week-table">
              <thead>
                <tr>
                  <th>週</th>
                  <th>最大重量</th>
                  <th>変化</th>
                </tr>
              </thead>
              <tbody>
                {weeklyRows.map((row) => (
                  <tr key={row.week}>
                    <td>{weekLabel(row.week)}</td>
                    <td className="weight-cell">{row.maxWeight.toFixed(1)} kg</td>
                    <td><TrendArrow change={row.change} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 全種目サマリーテーブル（フィルターなし時） */}
      {!exercise && exerciseSummary.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 className="section-title">種目別・週別サマリー</h3>
          <div className="week-table-wrap">
            <table className="week-table">
              <thead>
                <tr>
                  <th>種目</th>
                  {exerciseSummary[0].recentWeeks.map((wk) => (
                    <th key={wk}>{weekLabel(wk)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exerciseSummary.map((row) => (
                  <tr key={row.exercise}>
                    <td className="exercise-cell">
                      <Link href={`/exercise/${encodeURIComponent(row.exercise)}`} style={{ color: "inherit", textDecoration: "none" }}>
                        <span className="exercise-link">{row.exercise}</span>
                      </Link>
                    </td>
                    {row.weekMaxes.map((v, i) => (
                      <td key={i} className="weight-cell">
                        {v !== null ? `${v.toFixed(1)} kg` : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 記録リスト */}
      <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
        {workouts.map((w) => {
          const top = calcTopWeight(w);
          const isPR = top >= (prMap.get(w.exercise) ?? 0) && top > 0;

          if (editingId === w.id) {
            return (
              <EditCard
                key={w.id}
                workout={w}
                onSave={() => { setEditingId(null); load(); }}
                onCancel={() => setEditingId(null)}
              />
            );
          }

          return (
            <div key={w.id} className="card-inner workout-card">
              <div className="workout-head">
                <div>
                  <div className="workout-main">
                    <Link href={`/exercise/${encodeURIComponent(w.exercise)}`} style={{ color: "inherit", textDecoration: "none" }}>
                      <span className="exercise-link">{w.exercise}</span>
                    </Link>
                    {isPR && <span className="pr-badge">🏆 PR</span>}
                  </div>
                  <div className="muted">{w.date}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="edit-btn" onClick={() => setEditingId(w.id)} aria-label="編集">✏️</button>
                  <button className="delete-btn" onClick={() => deleteWorkout(w.id)} aria-label="削除">🗑</button>
                </div>
              </div>

              {w.notes && (
                <div style={{ color: "#444", marginTop: 6, fontSize: 13 }}>メモ：{w.notes}</div>
              )}

              <div className="workout-sets">
                {w.sets.map((s) => {
                  const orm = calcOneRM(s.weight, s.reps);
                  return (
                    <div key={s.setIndex} className="workout-setline">
                      第 {s.setIndex} セット：{s.weight} kg × {s.reps} 回
                      <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>
                        (推定1RM: {orm.toFixed(1)} kg)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
