import 'dotenv/config';

// Helper function to ensure required environment variables are set
function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const supaEnv = {
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseKey: requireEnv('SUPABASE_KEY'),
};

export const configEnvs = {
  PORT: requireEnv('PORT'),
  MONGODB_USERNAME: requireEnv('MONGODB_USERNAME'),
  MONGODB_PASSWORD: requireEnv('MONGODB_PASSWORD'),
  MONGODB_DB_NAME: requireEnv('MONGODB_DB_NAME'),
  CORS_WHITELIST_URL: requireEnv('CORS_WHITELIST_URL'),
  ENCRYPTION_KEY: requireEnv('ENCRYPTION_KEY'),
  PASSPORT_SECRET: requireEnv('PASSPORT_SECRET'),
  STRIPE_SECRET_KEY: requireEnv('STRIPE_SECRET_KEY'),
  ACCESS_SECRET: requireEnv('JWT_SECRET'),
  GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
  SUCCESS_URL_GOOGLE_CALLBACK: requireEnv('SUCCESS_URL_GOOGLE_CALLBACK'),
  FAILURE_URL_GOOGLE_CALLBACK: requireEnv('FAILURE_URL_GOOGLE_CALLBACK'),
  NODE_ENV: requireEnv('NODE_ENV'),
  SMTP_SERVICE: requireEnv('SMTP_SERVICE'),
  SMTP_USER: requireEnv('SMTP_USER'),
  SMTP_PASS: requireEnv('SMTP_PASS'),
  // TO-DO: Investigate the STATIC_DIR variable usage and decide if it should be added here or handled differently
  // STATIC_DIR: requireEnv('STATIC_DIR'),
};
