import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production', 'preview']).default('production'),
  DATABASE_URL: z.url().default('postgres://postgres:postgres@localhost:5432/postgres'),
  BASE_URL: z.url().default('http://localhost:3000'),
  SESSION_SECRET: z.string(),
  CORS_ORIGIN: z.url().default('http://localhost:5173'),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  SEED_ADMIN_EMAIL: z.email().default('admin@admin.com'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('azertyuiop'),
  API_MEDICAMENTS_URL: z.url().default('https://medicaments-api.giygas.dev'),
  API_MEDICAMENTS_TIMEOUT: z.coerce.number().default(5000),
  API_MEDICAMENTS_CACHE_TTL: z.coerce.number().default(900000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  process.exit(1);
}
// ts-prune-ignore-next
export type Env = z.infer<typeof envSchema>;
export const env = parsed.data;
