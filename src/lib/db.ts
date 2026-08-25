// This file creates a single Prisma client instance that is reused
// across the app (avoids creating too many connections during dev).

import { PrismaClient } from "@prisma/client";

// In development, Next.js hot-reloads modules which would create
// a new PrismaClient every time. We store it on the global object
// to avoid that.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
