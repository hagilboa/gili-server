import type { VercelRequest, VercelResponse } from "@vercel/node";
import { classify } from "../src/classifier";
import { runStep } from "../src/stateMachine"; // ודא שיש פונקציה כזו בקובץ

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sessionId, text } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    // סיווג טקסט לנושא/תת־נושא
    let classification = { topic: "לא מסווג", subtopic: "לא מסווג" };
    if (text) {
      classification = classify(text);
    }

    // הפעלת stateMachine
    const reply = runStep(sessionId, text || "", classification);

    return res.status(200).json({
      reply,
      sessionId,
      classification,
    });
  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
}
