import { configSchema } from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[Config] Environment validation failed:');
  console.error(parsed.error.flatten());
  process.exit(1);
}

export const config = parsed.data;
