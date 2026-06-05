function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Check if Bailian API is properly configured.
 * Returns true if both API key and base URL are set.
 */
export function isBailianConfigured(): boolean {
  return Boolean(process.env.ALI_BAILIAN_API_KEY) && Boolean(process.env.ALI_BAILIAN_BASE_URL);
}

/**
 * Get Bailian configuration or throw error if not configured.
 * Use this in service layer to provide clear error message.
 */
export function getBailianConfig(): { apiKey: string; baseUrl: string; modelName: string } {
  const apiKey = process.env.ALI_BAILIAN_API_KEY;
  const baseUrl = process.env.ALI_BAILIAN_BASE_URL;

  if (!apiKey || !baseUrl) {
    throw new Error('Bailian API is not configured. Please set ALI_BAILIAN_API_KEY and ALI_BAILIAN_BASE_URL in environment variables.');
  }

  return {
    apiKey,
    baseUrl,
    modelName: process.env.ALI_BAILIAN_MODEL_NAME ?? 'deepseek-v4-flash',
  };
}

export const env = {
  bailianApiKey: process.env.ALI_BAILIAN_API_KEY ?? "",
  bailianBaseUrl: process.env.ALI_BAILIAN_BASE_URL ?? "",
  bailianModelName: process.env.ALI_BAILIAN_MODEL_NAME ?? "deepseek-v4-flash",
};

export { requireEnv };
