import { getDbConnection, truncateTables, deleteTables, init } from './lib/database';
import { startEnpoint } from './endpoint';
import * as http from 'http';
import { Database } from 'sqlite3';

let conn: Database;
let server: http.Server;

const reqData = `{
  "org_name": "Paradise Island", "daughters": [
    { "org_name": "Banana tree", "daughters": [
      { "org_name": "Yellow Banana"},
      { "org_name": "Brown Banana"},
      { "org_name": "Black Banana"}
    ]},
    {"org_name": "Big banana tree", "daughters": [
      {"org_name": "Yellow Banana"},
      {"org_name": "Brown Banana"},
      {"org_name": "Green Banana"},
      {"org_name": "Black Banana", "daughters": [
        {"org_name": "Phoneutria Spider"}
      ]}
    ]}
  ]
}`;
describe('Endpoint', async () => {

  beforeAll(async () => {
    conn = await getDbConnection();
    return await init(conn);
  });

  beforeEach(async () => {
    server = await startEnpoint(conn, 3001);
  });

  afterEach(async () => {
    await truncateTables(conn);
    if (server) {
      server.close();
    }
  });

  afterAll(async () => {
    await deleteTables(conn);
    conn.close();
  });

  it('Save entries', async (done) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(reqData),
        },
      }, 
      (res) => {
        res.on('data', (chunk) => {
          expect(chunk.toString()).toBe('true');
          done();
        });
      });
    req.write(reqData);
    req.end();
  });

  it('Reads entries', async (done) => {
    const promise = new Promise((resolve, rej) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: 3001,
          path: '/',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(reqData),
          },
        },
        (res) => {
          res.on('data', resolve);
        });
      req.write(reqData);
      req.end();
    });
    await Promise.resolve(promise);
    http.get(encodeURI('http://localhost:3001/Black Banana'), (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        const parsedData = JSON.parse(rawData);
        const expectedOutput = [{
          relationship_type: 'parent', 
          org_name: 'Banana tree',
        }, { 
          relationship_type: 'parent', 
          org_name: 'Big banana tree',
        }, { 
          relationship_type: 'sister', 
          org_name: 'Brown Banana',
        }, { 
          relationship_type: 'sister', 
          org_name: 'Green Banana',
        }, { 
          relationship_type: 'daughter', 
          org_name: 'Phoneutria Spider',
        }, { 
          relationship_type: 'sister', 
          org_name: 'Yellow Banana',
        }];
        expect(parsedData).toEqual(expectedOutput);
        done();
      });
    });
  });

});
