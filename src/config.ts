import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  zapierWebhook: requireEnv("ZAPIER_WEBHOOK_URL"),
  originAllowlist: (process.env.ORIGIN_ALLOWLIST || "*")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
};
