import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_iXNzdYE8F0Mf@ep-withered-mode-aobdsjbq-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export * from "./schema";
