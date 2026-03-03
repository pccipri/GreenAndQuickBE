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
  supabaseKey: process.env.SUPABASE_KEY || requireEnv('SUPABASE_KEY'),
};
