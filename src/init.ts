import { Database } from 'sqlite3';
import { getDbConnection, promisedRun } from './lib/database';

getDbConnection().then(async (conn) => {
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
    'CREATE INDEX idx_owner_id_connected_id ON organizations_connections (owner_id, connected_id)',
  );
  await promisedRun(conn, 'CREATE UNIQUE INDEX idx_organizations_name ON organizations (name);');
  console.log('all set up');
});
