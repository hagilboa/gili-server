// api/message.ts
import { classifyText } from "../src/classifier";

export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sessionId, text } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const classification = classifyText(text || "");

    return res.status(200).json({
      reply: "קיבלתי ✅",
      sessionId,
      classification,
    });
  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Internal server error", details: err?.message });
  }
}
