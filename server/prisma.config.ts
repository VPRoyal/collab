import path from 'path'
import type { PrismaConfig } from 'prisma'
import dotenv from "dotenv";
dotenv.config();


export default {
  schema: path.join('prisma'),
} satisfies PrismaConfig