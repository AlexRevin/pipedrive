import { Database } from 'sqlite3';
import { getDbConnection } from './lib/database';
import { startEnpoint } from './endpoint';

async function start() {
  const conn = await getDbConnection();
  await startEnpoint(conn);
}

start().then(() => {
  console.log('started');
});
