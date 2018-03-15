import { Database } from 'sqlite3';
import * as path from 'path';

export async function getDbConnection(): Promise<Database> {
  let db: Database;
  return new Promise<Database>((res, rej) => {
    db = new Database(path.join(process.env.PWD, 'db', 'data.sqlite3'), (err) => {
      if (err) {
        console.log(err);
        rej(err);
      }
      res(db);
    });
  });
}

export async function promisedGet<T>(conn: Database, query: string, ...args): Promise<T> {
  return new Promise<T>((res, rej) => {
    conn.get(query, ...args, (err, row) => {
      if (err) {
        console.log(err);
        rej(err);
      }
      res({ ...row });
    });
  });
}

export async function promisedAll<T>(conn: Database, query: string, ...args): Promise<T[]> {
  return new Promise<T[]>((res, rej) => {
    conn.all(query, ...args, (err, rows) => {
      if (err) {
        console.log(err);
        rej(err);
      }
      res(rows);
    });
  });
}

export async function promisedRun(
  conn: Database, 
  query: string, 
  ...args,
): Promise<{sql: string, lastID: number, changes: number}> {
  return new Promise<{sql: string, lastID: number, changes: number}>((res, rej) => {
    conn.run(query, ...args, function (err) {
      if (err) {
        console.log(err);
        rej(err);
      }
      res(this);
    });
  });
}
