import { classifyWithTaxonomy, loadTaxonomy } from "../src/classifier";
import { steps, isStepValid, Step } from "../src/stateMachine";

export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sessionId, message, step, value } = req.body;

    // טוען את הטקסונומיה פעם אחת בכל בקשה
    const taxonomy = loadTaxonomy();

    // סיווג טקסט
    const classification = classifyWithTaxonomy(message || "", taxonomy);

    // בדיקת שלב אם נשלח step
    let stepValid: boolean | undefined = undefined;
    if (step && value !== undefined) {
      stepValid = isStepValid(step as Step, value);
    }

    return res.status(200).json({
      reply: `גילי כאן ✅`,
      sessionId,
      classification,
      stepValid,
    });
  } catch (error: any) {
    console.error("Error in /api/message:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
