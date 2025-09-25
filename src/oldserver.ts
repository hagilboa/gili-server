import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { classifyText } from "./classifier";
import { isStepValid, steps, Step } from "./stateMachine";

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(
  cors({
    origin: process.env.ORIGIN_ALLOWLIST?.split(",") || "*",
  })
);

const sessions: Record<string, { stepIndex: number; data: Record<string, string> }> = {};

const getReply = (sessionId: string, message: string) => {
  if (!sessions[sessionId]) {
    sessions[sessionId] = { stepIndex: 0, data: {} };
    return "שלום 👋, מה שמך הפרטי?";
  }

  const session = sessions[sessionId];
  const currentStep: Step = steps[session.stepIndex];

  if (!isStepValid(currentStep, message)) {
    return `הערך שהוזן לא תקין עבור ${currentStep}, נסה שוב ✏️`;
  }

  session.data[currentStep] = message;
  session.stepIndex++;

  if (session.stepIndex >= steps.length) {
    const classification = classifyText(Object.values(session.data).join(" "));
    return `תודה 🙏! קיבלנו את כל הפרטים. 
סיווג: נושא - ${classification.topic}, תת נושא - ${classification.subtopic}`;
  }

  const nextStep = steps[session.stepIndex];
  return `אנא ספק ${nextStep}`;
};

app.post("/api/message", (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  const reply = getReply(sessionId, message || "");
  res.json({ reply, sessionId });
});

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
