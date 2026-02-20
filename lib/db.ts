/**
 * Prisma database client singleton.
 *
 * Prisma v7 requires either a driver adapter or an Accelerate URL.
 * For local SQLite development, install @prisma/adapter-libsql:
 *
 *   npm install @prisma/adapter-libsql @libsql/client
 *
 * Then uncomment the adapter-based initialization below.
 * The in-memory services (lib/services/*) work without a database
 * and can be swapped to Prisma calls when the adapter is configured.
 */

// -- Uncomment when adapter is installed --
// import { PrismaClient } from './generated/prisma/client';
// import { PrismaLibSQL } from '@prisma/adapter-libsql'
// import { createClient } from '@libsql/client'
//
// const libsql = createClient({ url: 'file:prisma/dev.db' })
// const adapter = new PrismaLibSQL(libsql)
//
// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };
//
// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({ adapter });
//
// if (process.env.NODE_ENV !== 'production') {
//   globalForPrisma.prisma = prisma;
// }

export {};
