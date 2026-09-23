import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Add the Neon connection string to .env.local or Vercel env vars.");
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
