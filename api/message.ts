import type { VercelRequest, VercelResponse } from "@vercel/node";
import { classifyText } from "../src/classifier";
import { step } from "../src/stateMachine";

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
      classification = classifyText(text);
    }

    // מעביר את הקלט ל־stateMachine כדי לקבל את ההודעה של גילי
    const reply = step(sessionId, text || "", classification);

    return res.status(200).json({
      reply,        // ההודעה של גילי
      sessionId,    // מזהה השיחה
      classification, // סיווג אוטומטי
    });
  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}
