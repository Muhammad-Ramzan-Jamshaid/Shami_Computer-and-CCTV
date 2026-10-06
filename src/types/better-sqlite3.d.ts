declare module 'better-sqlite3' {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement<BindParameters extends any[] = any[]> {
    run(...params: BindParameters): RunResult;
    get(...params: BindParameters): any;
    all(...params: BindParameters): any[];
  }

  class Database {
    constructor(filename: string, options?: any);
    prepare(sql: string): Statement;
    exec(sql: string): this;
    pragma(pragma: string): any;
    transaction<F extends (...args: any[]) => any>(fn: F): F;
    close(): this;
  }

  export = Database;
}
