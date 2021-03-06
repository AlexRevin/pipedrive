import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Database } from 'sqlite3';
import { addOrganization, OrganizationData, getOrganization } from '../entities/organization';
import { Server } from 'http';

export async function startEnpoint(conn: Database, port: number = 3000): Promise<Server> {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post('/', async (req, res) => {
    try {
      const result = await addOrganization(conn, <OrganizationData>req.body);
      res.status(200).json(true);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  app.get('/:name', async (req, res) => {
    try {
      const result = await getOrganization(conn, req.params.name, req.query.page);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  const server = app.listen(port, () => {
    console.log('app running on port ', server.address().port);
  });
  return server;
}
