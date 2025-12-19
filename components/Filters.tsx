"use client";

/**
 * 筛选组件（按项目名）
 */
export default function Filters({
  exercise,
  setExercise,
}: {
  exercise: string;
  setExercise: (v: string) => void;
}) {
  return (
    <div className="card" style={{ marginTop: 20 }}>
      <label>
        项目筛选
        <input
          placeholder="例如：Bench / Squat"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
        />
      </label>
    </div>
  );
}
