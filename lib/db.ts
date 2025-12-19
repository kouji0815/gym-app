import Database from "better-sqlite3";

/**
 * SQLite は Node.js 上でのみ動く（ブラウザでは動かない）
 * そのため db.ts は API ルート（runtime=nodejs）からだけ import する
 */
const db = new Database("db.sqlite");

// テーブル初期化（存在しなければ作成）
db.exec(`
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  exercise TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL,
  set_index INTEGER NOT NULL,
  weight REAL NOT NULL,
  reps INTEGER NOT NULL,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
CREATE INDEX IF NOT EXISTS idx_workouts_exercise ON workouts(exercise);
CREATE INDEX IF NOT EXISTS idx_sets_workout_id ON workout_sets(workout_id);
`);

export default db;
