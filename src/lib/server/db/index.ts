import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as authSchema from './auth-schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = postgres(env.DATABASE_URL);

// App tables (with their relations) back db.query. The shared Better Auth tables get their own
// drizzle instance so their verbose generated types stay out of db's relational inference, which
// otherwise degrades to `any`. Both share the one connection.
export const db = drizzle(client, { schema });
export const authDb = drizzle(client, { schema: authSchema });
