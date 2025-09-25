import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Step, isStepValid } from '../src/stateMachine.js';
import { classifyWithTaxonomy } from '../src/classifier.js';
import { loadTaxonomy } from '../src/classifier.js';

const taxonomy = loadTaxonomy();

interface Session {
  step: Step;
  data: Record<string, string>;
}

const sessions: Record<string, Session> = {};

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId and message are required" });
  }

  if (!sessions[sessionId]) {
    sessions[sessionId] = { step: "first_name", data: {} };
  }

  const session = sessions[sessionId];
  const currentStep = session.step;

  // בדיקת תשובה מול ה־validator
  if (!isStepValid(currentStep, message)) {
    return res.json({ reply: `הערך שסיפקת לא תקין עבור ${currentStep}, אנא נסה שוב.` });
  }

  // שמירה במידע
  session.data[currentStep] = message;

  // התקדמות לשלב הבא
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex < steps.length - 1) {
    session.step = steps[currentIndex + 1];
    return res.json({ reply: `המשך`, sessionId });
  }

  // סיום – סיווג
  const description = session.data["description"] || "";
  const classification = classifyWithTaxonomy(description, taxonomy);

  delete sessions[sessionId]; // סגירת השיחה

  return res.json({
    reply: "✅ סיימנו",
    sessionId,
    classification
  });
}
