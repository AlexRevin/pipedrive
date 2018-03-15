import { Database } from 'sqlite3';
import { getDbConnection, init } from './lib/database';
require('dotenv').config();

getDbConnection().then(async (conn) => {
  await init(conn);
});
