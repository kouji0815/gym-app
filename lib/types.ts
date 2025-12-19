// ここでは「フロント⇔API」で使う型を定義する（拡張しやすいように分離）

export type WorkoutSetInput = {
  weight: number; // 重量（kg固定）
  reps: number; // 回数
};

export type WorkoutCreateInput = {
  date: string; // YYYY-MM-DD
  exercise: string; // 種目名
  notes?: string; // メモ（任意）
  sets: WorkoutSetInput[]; // セット配列
};
