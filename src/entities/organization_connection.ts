import { Database } from 'sqlite3';
import { promisedRun, promisedAll } from '../lib/database';
import { RelationshipType } from './organization';

export enum ConnectionType {
  Parent = 1,
  Sister = 2,
  Daughter = 3,
}

interface OrganizationConnectionsResult {
  owner_id: number;
  connection_type: ConnectionType;
  name: string;
}


export function connectionToString(type: ConnectionType): RelationshipType {
  switch (type) {
    case ConnectionType.Parent:
      return 'parent';
    case ConnectionType.Daughter:
      return 'daughter';
    case ConnectionType.Sister:
      return 'sister';
  }
}

export async function getOrganizationConnections(
  conn: Database, 
  ownerId: number,
  offset: number = 0,
): Promise<OrganizationConnectionsResult[]> {
  return promisedAll<OrganizationConnectionsResult>(
    conn,
    `SELECT oc.owner_id, oc.connection_type, o.name FROM organizations_connections oc 
     LEFT JOIN organizations o on oc.connected_id = o.id 
     WHERE oc.owner_id = ? ORDER BY o.name ASC LIMIT 100 OFFSET ?
    `, 
    ownerId, offset * 100,
  );
}

export async function addParentRelation(
  conn: Database, 
  entityId: number, 
  parentId: number,
): Promise<void> {
  await promisedRun(
    conn,
    `INSERT OR IGNORE INTO organizations_connections(owner_id, connected_id, connection_type) 
    VALUES(?,?,?)`,
    [entityId, parentId, ConnectionType.Parent],
  );
  await promisedRun(
    conn,
    `INSERT OR IGNORE INTO organizations_connections(owner_id, connected_id, connection_type) 
    VALUES(?,?,?)`,
    [parentId, entityId, ConnectionType.Daughter],
  );
  const sisters = await promisedAll<{ connected_id: number }>(
    conn,
    `SELECT connected_id FROM organizations_connections WHERE owner_id = ? AND connection_type = ?`,
    [parentId, ConnectionType.Daughter],
  );
  const promises = sisters.map(async (s) => {
    if (s.connected_id !== entityId) {
      await promisedRun(
        conn,
        `INSERT OR IGNORE INTO organizations_connections(owner_id, connected_id, connection_type) 
        VALUES(?,?,?)`,
        [entityId, s.connected_id, ConnectionType.Sister],
      );
      await promisedRun(
        conn,
        `INSERT OR IGNORE INTO organizations_connections(owner_id, connected_id, connection_type) 
        VALUES(?,?,?)`,
        [s.connected_id, entityId, ConnectionType.Sister],
      );
    }
  });
}

