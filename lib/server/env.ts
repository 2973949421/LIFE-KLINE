function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  bailianApiKey: process.env.ALI_BAILIAN_API_KEY ?? "",
  bailianBaseUrl: process.env.ALI_BAILIAN_BASE_URL ?? "",
  bailianModelName: process.env.ALI_BAILIAN_MODEL_NAME ?? "qwen-max",
};

export { requireEnv };