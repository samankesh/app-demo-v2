import { DBSQLClient } from '@databricks/sql';

function getHttpPathFromId(warehouseId: string) {
  return `/sql/1.0/warehouses/${warehouseId}`;
}

export async function queryWithAppSP(sql: string, params?: any[]) {
  const host = process.env.DATABRICKS_HOST?.replace(/^https?:\/\//, '')!;
  
  const warehouseId = process.env.SQL_WAREHOUSE_ID;
  const clientId = process.env.DATABRICKS_CLIENT_ID;
  const clientSecret = process.env.DATABRICKS_CLIENT_SECRET;
  
  const httpPath = getHttpPathFromId(warehouseId!);

  if (!clientId || !clientSecret) {
    throw new Error("Missing DATABRICKS_CLIENT_ID or DATABRICKS_CLIENT_SECRET environment variables.");
  }
  if (!warehouseId) {
    throw new Error("Missing SQL_WAREHOUSE_ID environment variables.");
  }

  const client = new DBSQLClient();
  
  const connectOptions: any = {
    host,
    path: httpPath,
    authType: 'databricks-oauth',
    oauthClientId: clientId,
    oauthClientSecret: clientSecret,
  };

  await client.connect(connectOptions);

  const session = await client.openSession();
  const op = await session.executeStatement(sql, {
    runAsync: true,
    ordinalParameters: params ?? [],
    maxRows: 10000,
  });

  await op.status(true);
  const rows = await op.fetchAll();

  await op.close();
  await session.close();
  await client.close();

  return rows;
}

