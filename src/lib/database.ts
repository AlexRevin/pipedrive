import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import { Config } from '..';

const sqlite = sqlite3.verbose();

export async function getDbConnection(): Promise<sqlite3.Database> {
  let db: sqlite3.Database;
  return new Promise<sqlite3.Database>((res, rej) => {
    db = new sqlite3.Database(
      path.join((<Config>process.env).PWD, `data.${(<Config>process.env).MODE}.sqlite3`),
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (err) => {
        if (err) {
          console.log(err);
          rej(err);
        }
        res(db);
      });
  });
}

export async function promisedGet<T>(conn: sqlite3.Database, query: string, ...args): Promise<T> {
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

export async function promisedAll<T>(conn: sqlite3.Database, query: string, ...args): Promise<T[]> {
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
  conn: sqlite3.Database, 
  query: string, 
  ...args,
): Promise<{sql: string, lastID: number, changes: number}> {
  return new Promise<{sql: string, lastID: number, changes: number}>((res, rej) => {
    conn.run(query, ...args, function (err) {
      if (err) {
        console.log(query);
        console.log('errrrr:', err);
        rej(err);
      }
      res(this);
    });
  });
}

export async function init(conn: sqlite3.Database) {
  await promisedRun(
    conn, 
    'CREATE TABLE organizations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)',
  );
  await promisedRun(
    conn, 
    `CREATE TABLE organizations_connections 
    (owner_id INTEGER, connected_id INTEGER, connection_type INTEGER)`,
  );
  await promisedRun(
    conn, 
    `CREATE UNIQUE INDEX idx_organizations_connections ON organizations_connections 
    (owner_id, connected_id, connection_type)`,
  );
  await promisedRun(
    conn, 
    `CREATE INDEX idx_owner_id_connected_id ON 
    organizations_connections (owner_id, connected_id)`,
  );
  await promisedRun(
    conn, 
    `CREATE INDEX idx_owner_id ON 
    organizations_connections (owner_id)`,
  );
  await promisedRun(conn, 'CREATE UNIQUE INDEX idx_organizations_name ON organizations (name);');
  return;
}

export async function truncateTables(conn) {
  return promisedRun(
    conn, 
    `DELETE FROM organizations;
     DELETE FROM organizations_connections;
    `,
  );
}

export async function deleteTables(conn) {
  return Promise.all([
    promisedRun(
    conn, `DROP TABLE IF EXISTS organizations`,
  ),
    promisedRun(
    conn, `DROP TABLE IF EXISTS organizations_connections`,
  )]);
}
