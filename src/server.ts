import express from "express";
import bodyParser from "body-parser";
import { classify } from "./classifier";
import { validateMobile } from "./validators";
import { sendToZapier } from "./zapier";

const app = express();
app.use(bodyParser.json());

// ניהול סשנים בזיכרון
const sessions = new Map<string, any>();

// שלבי השיחה
const steps = [
  "first_name",
  "last_name",
  "mobile",
  "reporter_city",
  "event_city",
  "description",
  "attachment",
  "confirm"
];

const prompts: Record<string, string> = {
  first_name: "היי, אני גילי ממוקד מועצה אזורית הגלבוע 🌿. איך קוראים לך?",
  last_name: "ומה שם המשפחה?",
  mobile: "מה מספר הטלפון הנייד שלך?",
  reporter_city: "באיזה יישוב אתה גר?",
  event_city: "באיזה יישוב התרחש האירוע?",
  description: "במה אפשר לעזור?",
  attachment: "רוצה לצרף תמונה או מסמך שיעזור לנו? (כן/לא)",
  confirm: "האם לאשר ולשלוח את הפנייה?"
};

app.post("/api/message", async (req, res) => {
  const { sessionId, text } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { stepIndex: 0, data: {} });
  }

  const session = sessions.get(sessionId);
  let currentStep = steps[session.stepIndex];

  if (text) {
    if (currentStep === "mobile") {
      if (!validateMobile(text)) {
        return res.json({ reply: "מספר הטלפון לא תקין, נסה שוב בבקשה" });
      }
    }

    if (currentStep === "attachment" && text.toLowerCase() === "לא") {
      session.data.attachment = "";
    } else if (currentStep === "attachment" && text.toLowerCase() !== "לא") {
      session.data.attachment = text;
    } else {
      session.data[currentStep] = text;
    }

    session.stepIndex++;
    currentStep = steps[session.stepIndex];
  }

  if (!currentStep) {
    const data = session.data;

    const { topic, subtopic } = classify(data.description || "");
    data.topic = topic;
    data.subtopic = subtopic;

    console.log("📤 Sending data to Zapier:", data);
    await sendToZapier(data);

    sessions.delete(sessionId);

    return res.json({
      reply: `תודה ${data.first_name}, הפנייה שלך נשלחה למוקד ✅`
    });
  }

  if (currentStep === "confirm") {
    const d = session.data;
    return res.json({
      reply: `תודה ${d.first_name}, ריכזתי את הפנייה שלך:\n• תיאור: ${d.description}\n• נושא: ${d.topic || "לא סווג"} – ${d.subtopic || "לא סווג"}\n• מקום מגורים: ${d.reporter_city}\n• מקום האירוע: ${d.event_city}\n• טלפון: ${d.mobile}\n\nלאשר ולשלוח?`
    });
  }

  res.json({ reply: prompts[currentStep] });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

export default app;
