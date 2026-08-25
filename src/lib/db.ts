// Prisma client singleton using the better-sqlite3 adapter (Prisma 7 requirement).
// We store it on globalThis so hot-reloads in dev don't create multiple instances.

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const dbPath = process.env.DATABASE_URL?.replace("file:", "") ?? "./prisma/dev.db";
  const absolutePath = path.isAbsolute(dbPath)
    ? dbPath
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), dbPath);

  const adapter = new PrismaBetterSqlite3({ url: `file:${absolutePath}` });
  return new PrismaClient({ adapter } as any);
}


export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
