import { DBSQLClient } from '@databricks/sql';

function getHttpPathFromId(warehouseId: string) {
  return `/sql/1.0/warehouses/${warehouseId}`;
}

// Shared client instance
let globalClient: DBSQLClient | null = null;

async function getClient() {
  if (globalClient) {
    return globalClient;
  }

  const host = process.env.DATABRICKS_HOST?.replace(/^https?:\/\//, '');
  const warehouseId = process.env.SQL_WAREHOUSE_ID;
  const clientId = process.env.DATABRICKS_CLIENT_ID;
  const clientSecret = process.env.DATABRICKS_CLIENT_SECRET;
  
  if (!host) {
    throw new Error("Missing DATABRICKS_HOST environment variable.");
  }
  
  if (!clientId || !clientSecret) {
    throw new Error("Missing DATABRICKS_CLIENT_ID or DATABRICKS_CLIENT_SECRET environment variables.");
  }
  if (!warehouseId) {
    throw new Error("Missing SQL_WAREHOUSE_ID environment variables.");
  }

  const httpPath = getHttpPathFromId(warehouseId);
  const client = new DBSQLClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connectOptions: any = {
    host,
    path: httpPath,
    authType: 'databricks-oauth',
    oauthClientId: clientId,
    oauthClientSecret: clientSecret,
  };

  try {
    await client.connect(connectOptions);
    globalClient = client;
    return client;
  } catch (error) {
    console.error("Failed to connect to DBSQL:", error);
    throw error;
  }
}

export async function queryWithAppSP(sql: string, params?: unknown[], retryCount = 0): Promise<unknown[]> {
  try {
    const client = await getClient();
    const session = await client.openSession();
    
    try {
      const op = await session.executeStatement(sql, {
        runAsync: true,
        ordinalParameters: params ?? [],
        maxRows: 10000,
      });

      await op.status(true);
      const rows = await op.fetchAll();
      await op.close();
      
      return rows;
    } finally {
      await session.close();
      // Do NOT close the client here, keep it open for reuse
    }
  } catch (error) {
    console.error(`Query failed (attempt ${retryCount + 1}):`, error);

    // Check if error is related to authentication or connection issues
    // DBSQL errors often contain strings like "InvalidAccessToken", "Expired", "401", etc.
    const isAuthError = error instanceof Error && (
      error.message.includes('InvalidAccessToken') || 
      error.message.includes('Expired') ||
      error.message.includes('401') ||
      error.message.includes('Unauthenticated') ||
      error.message.includes('Auth')
    );

    // If it's an auth error and we haven't retried yet, force a reconnect
    if (isAuthError && retryCount < 1) {
      console.warn("Authentication error detected. Resetting client and retrying...");
      // Force reset of the global client to trigger a new connection/auth handshake
      if (globalClient) {
        try {
           await globalClient.close();
        } catch (e) {
           console.warn("Failed to close existing client during reset:", e);
        }
        globalClient = null;
      }
      
      // Retry the query once
      return queryWithAppSP(sql, params, retryCount + 1);
    }

    throw error;
  }
}

