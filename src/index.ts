import { Database } from 'sqlite3';
import { getDbConnection } from './lib/database';
import { startEnpoint } from './endpoint';
require('dotenv').config();

type ModeType = 'development' | 'test' | 'production';
export interface Config extends NodeJS.ProcessEnv{
  MODE: ModeType;
  PWD: string;
}

async function start() {
  const conn = await getDbConnection();
  await startEnpoint(conn);
}

start();
