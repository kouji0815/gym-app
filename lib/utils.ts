// Epley式: 1RM = weight × (1 + reps / 30)
export function calcOneRM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

// 今週（月曜始まり）に何日トレーニングしたか
export function thisWeekDays(workouts: { date: string }[]): number {
  const now = new Date();
  const day = now.getDay() || 7; // 0=日→7
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  const days = new Set(
    workouts
      .filter((w) => new Date(w.date + "T00:00:00") >= monday)
      .map((w) => w.date)
  );
  return days.size;
}
