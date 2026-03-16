import { z } from "zod";

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().optional().default(""),
  TURSO_AUTH_TOKEN: z.string().optional().default(""),
  NEXT_PUBLIC_APP_URL: z.string().optional().default("http://localhost:3000")
});

export const env = envSchema.parse({
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
});

export const hasRemoteDatabase = Boolean(env.TURSO_DATABASE_URL);

