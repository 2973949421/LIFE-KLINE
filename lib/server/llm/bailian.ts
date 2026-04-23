import { createOpenAI } from "@ai-sdk/openai";

import { env } from "../env";

export const bailian = createOpenAI({
  apiKey: env.bailianApiKey || undefined,
  baseURL: env.bailianBaseUrl || undefined,
} as const);
