export const config = {
  port: parseInt(process.env.PORT || "8080", 10),
  zapierHook: process.env.ZAPIER_HOOK_URL || "",
  origins: (process.env.ORIGIN_ALLOWLIST || "").split(",").map(s => s.trim()).filter(Boolean),
  classifierMinScore: parseInt(process.env.CLASSIFIER_MIN_SCORE || "1", 10)
};

if (!config.zapierHook) {
  console.error("ZAPIER_HOOK_URL חסר בקובץ הסביבה");
  process.exit(1);
}
