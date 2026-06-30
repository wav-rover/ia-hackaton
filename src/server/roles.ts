/**
 * Application roles. Mirrors the Prisma `Role` enum / Drizzle `role` column, but
 * lives here so the Auth.js config stays independent of the chosen ORM.
 */
export type Role = "USER" | "ADMIN";
