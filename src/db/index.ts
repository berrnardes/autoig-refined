import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authSchema from "./auth-schema";
import * as schema from "./schema";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: { rejectUnauthorized: false },
	// Connection pool limits — tune these to your hosting environment.
	// Serverless (Vercel/Lambda): keep max low (5–10) since each cold start creates its own pool.
	// Long-running (VPS/container): can go higher (15–30) depending on your PG max_connections.
	max: parseInt(process.env.DB_POOL_MAX ?? "1", 10),
	// Release idle clients back to the pool after 30s
	idleTimeoutMillis: 30_000,
	// Fail fast if a connection can't be acquired within 5s
	connectionTimeoutMillis: 5_000,
});

export const db = drizzle(pool, { schema: { ...schema, ...authSchema } });
