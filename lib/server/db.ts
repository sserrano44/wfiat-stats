import "server-only";
import { Pool, QueryResult, QueryResultRow } from "pg";

// Server-only singleton pattern for database pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Please configure it in .env"
      );
    }

    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected database pool error:", err);
    });
  }

  return pool;
}

// Execute parameterized query with error handling
export async function query<T extends QueryResultRow>(
  sql: string,
  params: (string | number | Date | null | boolean)[] = []
): Promise<T[]> {
  const poolInstance = getPool();
  try {
    const result: QueryResult<T> = await poolInstance.query<T>(sql, params);
    return result.rows;
  } catch (error) {
    // Check for analytics tables not existing
    if (
      error instanceof Error &&
      error.message.includes('relation "analytics.')
    ) {
      const tableMatch = error.message.match(/relation "([^"]+)"/);
      throw new Error(
        `Analytics table ${tableMatch?.[1] || "unknown"} does not exist. Run analytics jobs first.`
      );
    }
    console.error("Database query error:", error);
    throw error;
  }
}

// Scale NUMERIC values by token decimals (handle BigInt strings)
export function scaleValue(
  value: string | number | null | undefined,
  decimals: number = 18
): number {
  if (value === null || value === undefined) return 0;
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return 0;
  return numValue / Math.pow(10, decimals);
}

// For graceful shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
