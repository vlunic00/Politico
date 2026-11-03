import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is required for database operations.");
  const schema = new URL(process.env.DATABASE_URL).searchParams.get("schema") ?? "public";
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) throw new Error("Invalid database schema.");
  const db =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 5000,
      }, { schema }),
    });
  globalForPrisma.prisma = db;
  return db;
}
