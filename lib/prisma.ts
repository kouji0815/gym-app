// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(); // 6.x 不需要传 adapter

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;