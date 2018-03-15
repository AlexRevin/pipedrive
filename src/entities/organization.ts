import { Database } from 'sqlite3';
import { promisedRun, promisedGet, promisedAll } from '../lib/database';
import { 
  addParentRelation, 
  getOrganizationConnections, 
  connectionToString,
} from './organization_connection';

export interface OrganizationData {
  id: number;
  org_name: string;
  daughters?: OrganizationData[];
}

export type RelationshipType = 'parent' | 'sister' | 'daughter';

export interface OrganizationOutput {
  relationship_type: RelationshipType;
  org_name: string;
}

export async function addOrganization(conn: Database, data: OrganizationData, parentId?: number) {
  await promisedRun(conn, 'INSERT OR IGNORE INTO organizations(name) VALUES(?)', data.org_name);
  const { id } = await promisedGet<{id: number}>(
    conn, 
    'SELECT id FROM organizations WHERE name = ?', data.org_name,
  );
  if (typeof parentId !== 'undefined') {
    await addParentRelation(conn, id, parentId);
  }
  if (data.daughters) {
    const promises = data.daughters.map(d => addOrganization(conn, d, id));
    await Promise.all(promises);
  }
}

export async function getOrganization(conn: Database, name: string, offset: number = 0) {
  const { id } = await promisedGet<{id: number}>(
    conn, 'SELECT id FROM organizations WHERE name = ?', name,
  );
  const connections = await getOrganizationConnections(conn, id, offset);
  return connections.map<{relationship_type: RelationshipType, org_name: string}>((connection) => {
    return {
      relationship_type: connectionToString(connection.connection_type),
      org_name: connection.name,
    };
  });
}
