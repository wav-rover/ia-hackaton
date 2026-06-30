import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved connection config out of the schema. The CLI (migrate, studio)
// reads the database URL from here; the runtime client uses a driver adapter.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
