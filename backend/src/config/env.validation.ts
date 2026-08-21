const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'REDIS_HOST', 'REDIS_PORT'];
const NUMERIC = ['PORT', 'REDIS_PORT', 'THROTTLE_TTL', 'THROTTLE_LIMIT', 'MAX_FILE_SIZE'];
const SECRETS = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET'];
const MIN_SECRET_LENGTH = 32;
const PLACEHOLDER = 'generate-me';

// Runs before the app boots, so misconfiguration fails immediately with a named cause
// instead of surfacing as a 500 on whichever request happens to touch it.
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const problems: string[] = [];

  for (const key of REQUIRED) {
    if (!config[key]) problems.push(`${key} is required but missing`);
  }

  for (const key of SECRETS) {
    const value = config[key] as string | undefined;
    if (!value) continue;
    if (value === PLACEHOLDER) {
      problems.push(`${key} is still the placeholder value. Run \`npm run setup\` to generate it.`);
    } else if (value.length < MIN_SECRET_LENGTH) {
      problems.push(
        `${key} must be at least ${MIN_SECRET_LENGTH} characters (found ${value.length})`,
      );
    }
  }

  for (const key of NUMERIC) {
    const value = config[key];
    if (value !== undefined && value !== '' && Number.isNaN(Number(value))) {
      problems.push(`${key} must be a number, got "${value}"`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}\n` +
        `See backend/.env.example for the full list.`,
    );
  }

  return config;
}
