"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SetRow = { weight: string; reps: string };

type Template = {
  id: number;
  name: string;
  exercise: string;
  sets: { setIndex: number; weight: number; reps: number }[];
};

export default function WorkoutForm() {
  const router = useRouter();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [exercise, setExercise] = useState("");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"simple" | "detail">("simple");

  // シンプルモード用
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [setCount, setSetCount] = useState("");

  // 詳細モード用
  const [sets, setSets] = useState<SetRow[]>([{ weight: "", reps: "" }]);

  // オートコンプリート
  const [exercises, setExercises] = useState<string[]>([]);

  // テンプレート
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showSaveName, setShowSaveName] = useState(false);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.exercises)) setExercises(d.exercises); })
      .catch(() => {});
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.templates)) setTemplates(d.templates); })
      .catch(() => {});
  }, []);

  function applyTemplate(t: Template) {
    setExercise(t.exercise);
    setSets(t.sets.map((s) => ({ weight: String(s.weight), reps: String(s.reps) })));
    setMode("detail");
  }

  async function deleteTemplate(id: number) {
    await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function saveTemplate() {
    if (!templateName.trim()) { alert("テンプレート名を入力してください"); return; }
    const payload = buildPayload();
    if (!payload) return;
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: templateName.trim(), exercise: payload.exercise, sets: payload.sets }),
    });
    if (res.ok) {
      const d = await res.json();
      setTemplates((prev) => [
        { id: d.id, name: templateName.trim(), exercise: payload.exercise, sets: payload.sets.map((s, i) => ({ setIndex: i + 1, weight: s.weight, reps: s.reps })) },
        ...prev,
      ]);
      setShowSaveName(false);
      setTemplateName("");
      alert("テンプレートを保存しました");
    } else {
      alert("保存失敗");
    }
  }

  function addSet() {
    setSets((prev) => [...prev, { weight: "", reps: "" }]);
  }

  function removeSet(i: number) {
    if (sets.length === 1) return;
    setSets((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateSet(i: number, field: "weight" | "reps", val: string) {
    setSets((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  }

  function buildPayload() {
    if (!exercise.trim()) { alert("種目名を入力してください"); return null; }

    let payloadSets: { weight: number; reps: number }[];

    if (mode === "simple") {
      const w = Number(weight);
      const r = Number(reps);
      const c = Math.floor(Number(setCount));
      if (!weight || !reps || !setCount || !Number.isFinite(w) || !Number.isFinite(r) || !Number.isFinite(c) || w < 0 || r < 1 || c < 1) {
        alert("正しい重量、回数、セット数を入力してください");
        return null;
      }
      payloadSets = Array.from({ length: c }, () => ({ weight: w, reps: r }));
    } else {
      for (const s of sets) {
        if (!s.weight || !s.reps || Number(s.weight) < 0 || Number(s.reps) < 1) {
          alert("全セットに正しい重量と回数を入力してください");
          return null;
        }
      }
      payloadSets = sets.map((s) => ({ weight: Number(s.weight), reps: Number(s.reps) }));
    }

    return {
      date,
      exercise: exercise.trim(),
      notes: notes.trim() || undefined,
      sets: payloadSets,
    };
  }

  async function submit() {
    const payload = buildPayload();
    if (!payload) return;
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { alert("保存失敗"); return; }
      router.push("/");
    } catch {
      alert("ネットワークエラー");
    }
  }

  return (
    <div>
      {/* テンプレートエリア */}
      {templates.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="h2" style={{ marginBottom: 10 }}>📋 テンプレートから呼び出す</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {templates.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button className="btn btn-secondary" style={{ fontSize: 13, padding: "6px 14px" }} onClick={() => applyTemplate(t)}>
                  {t.name}
                </button>
                <button
                  className="delete-btn"
                  style={{ width: 28, height: 28, fontSize: 12 }}
                  onClick={() => deleteTemplate(t.id)}
                  aria-label="削除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 className="h2">記録</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`btn ${mode === "simple" ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: 12, padding: "6px 14px" }}
              onClick={() => setMode("simple")}
            >
              シンプル
            </button>
            <button
              className={`btn ${mode === "detail" ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: 12, padding: "6px 14px" }}
              onClick={() => setMode("detail")}
            >
              詳細
            </button>
          </div>
        </div>

        <div className="form-grid">
          <label>
            種目名
            <input
              list="exercise-list"
              placeholder="例: Bench Press"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
            />
            <datalist id="exercise-list">
              {exercises.map((ex) => <option key={ex} value={ex} />)}
            </datalist>
          </label>
          <label>
            日付
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        {/* メモ欄 */}
        <div style={{ marginTop: 14 }}>
          <label>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>メモ（任意）</span>
            <textarea
              className="notes-textarea"
              placeholder="「今日は調子よかった」「肩が痛い」など（任意）"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </label>
        </div>

        {/* シンプルモード */}
        {mode === "simple" && (
          <div className="ios-card mt-16">
            <div className="ios-row">
              <div className="ios-label">重量</div>
              <div className="ios-right">
                <div className="with-unit">
                  <input className="unit-input" type="number" placeholder="---" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  <span className="unit-suffix">kg</span>
                </div>
              </div>
            </div>
            <div className="ios-divider" />
            <div className="ios-row">
              <div className="ios-label">回数</div>
              <div className="ios-right">
                <div className="with-unit">
                  <input className="unit-input" type="number" placeholder="---" value={reps} onChange={(e) => setReps(e.target.value)} />
                  <span className="unit-suffix">回</span>
                </div>
              </div>
            </div>
            <div className="ios-divider" />
            <div className="ios-row">
              <div className="ios-label">セット数</div>
              <div className="ios-right">
                <div className="with-unit">
                  <input className="unit-input" type="number" placeholder="---" value={setCount} onChange={(e) => setSetCount(e.target.value)} />
                  <span className="unit-suffix">セット</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 詳細モード */}
        {mode === "detail" && (
          <div className="ios-card mt-16" style={{ padding: "0 14px" }}>
            {sets.map((s, i) => (
              <div key={i} className="set-row">
                <div className="set-row-num">第 {i + 1} セット</div>
                <input
                  className="set-row-input"
                  type="number"
                  placeholder="重量"
                  value={s.weight}
                  onChange={(e) => updateSet(i, "weight", e.target.value)}
                />
                <span style={{ color: "var(--muted)", fontSize: 13 }}>kg</span>
                <input
                  className="set-row-input"
                  type="number"
                  placeholder="回数"
                  value={s.reps}
                  onChange={(e) => updateSet(i, "reps", e.target.value)}
                />
                <span style={{ color: "var(--muted)", fontSize: 13 }}>回</span>
                <button
                  className="delete-btn"
                  style={{ width: 32, height: 32, fontSize: 14, marginLeft: "auto" }}
                  onClick={() => removeSet(i)}
                  disabled={sets.length === 1}
                  aria-label="削除"
                >
                  🗑
                </button>
              </div>
            ))}
            <div style={{ padding: "10px 0" }}>
              <button className="btn btn-secondary" style={{ width: "100%", fontSize: 13 }} onClick={addSet}>
                ＋ セット追加
              </button>
            </div>
          </div>
        )}

        <button className="btn btn-primary mt-16" style={{ width: "100%" }} onClick={submit}>
          記録する
        </button>

        {/* テンプレート保存エリア */}
        <div style={{ marginTop: 12 }}>
          {!showSaveName ? (
            <button
              className="btn btn-secondary"
              style={{ width: "100%", fontSize: 13 }}
              onClick={() => setShowSaveName(true)}
            >
              💾 テンプレートとして保存
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                placeholder="テンプレート名を入力"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" style={{ fontSize: 13, padding: "8px 16px" }} onClick={saveTemplate}>保存</button>
              <button className="btn btn-secondary" style={{ fontSize: 13, padding: "8px 16px" }} onClick={() => { setShowSaveName(false); setTemplateName(""); }}>×</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
