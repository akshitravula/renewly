import postgres from "postgres";
import fs from "fs";
import path from "path";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_iXNzdYE8F0Mf@ep-withered-mode-aobdsjbq-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function runMigration() {
  console.log("Connecting to database for migration...");
  const sql = postgres(connectionString, { max: 1 });

  try {
    const migrationFile = path.join(__dirname, "migrations/0000_absent_justin_hammer.sql");
    const rawSql = fs.readFileSync(migrationFile, "utf-8");

    // Split by drizzle statement-breakpoint
    const statements = rawSql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Executing ${statements.length} migration statements...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await sql.unsafe(stmt);
      } catch (err: any) {
        // Ignore "already exists" errors during re-runs
        if (
          err.code === "42710" || // duplicate object/type
          err.code === "42P07" || // relation already exists
          err.message?.includes("already exists")
        ) {
          // Expected on re-runs
          continue;
        } else {
          console.error(`Error on statement #${i + 1}:`, stmt.substring(0, 80));
          throw err;
        }
      }
    }

    console.log("Migration executed successfully!");
  } finally {
    await sql.end();
  }
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
