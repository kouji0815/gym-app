// better-sqlite3 の型が不足する場合の最小宣言（VSCodeの赤線対策）
declare module "better-sqlite3" {
  class Database {
    constructor(filename?: string);
    exec(sql: string): void;
    prepare(sql: string): any;
    transaction<T>(fn: () => T): () => T;
  }
  export default Database;
}
