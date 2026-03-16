import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/drizzle/schema";
import { env } from "@/lib/env";

const localUrl = process.env.NODE_ENV === "production" ? "" : "file:local.db";
const databaseUrl = env.TURSO_DATABASE_URL || localUrl;

export const hasDatabaseConnection = Boolean(databaseUrl);

export const client = hasDatabaseConnection
  ? createClient({
      url: databaseUrl,
      authToken: env.TURSO_AUTH_TOKEN || undefined
    })
  : null;

export const db = client ? drizzle(client, { schema }) : null;
