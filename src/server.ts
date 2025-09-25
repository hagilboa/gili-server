import express from "express";
import bodyParser from "body-parser";
import { classify } from "./classifier";
import { validateMobile } from "./validators";
import { sendToZapier } from "./zapier";
import { config } from "./config";

const app = express();
app.use(bodyParser.json());

// ניהול סשנים בזיכרון (בשלב הבא אפשר לעבור ל-Redis)
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

// ===== פונקציית API ראשית =====
app.post("/api/message", async (req, res) => {
  const { sessionId, text } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  // יצירת סשן חדש אם לא קיים
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { stepIndex: 0, data: {} });
  }

  const session = sessions.get(sessionId);
  let currentStep = steps[session.stepIndex];

  // שמירת תשובה מהמשתמש
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

  // אם סיימנו את כל השלבים → שליחה ל-Zapier
  if (!currentStep) {
    const data = session.data;

    // סיווג
    const { topic, subtopic } = classify(data.description || "");
    data.topic = topic;
    data.subtopic = subtopic;

    console.log("📤 Sending to Zapier:", JSON.stringify(data, null, 2));
    await sendToZapier(data);

    // מחיקת הסשן
    sessions.delete(sessionId);

    return res.json({
      reply: `תודה ${data.first_name}, הפנייה שלך נשלחה למוקד ✅`
    });
  }

  // שלב סיכום לפני אישור
  if (currentStep === "confirm") {
    const d = session.data;
    return res.json({
      reply: `תודה ${d.first_name}, ריכזתי את הפנייה שלך:\n• תיאור: ${d.description}\n• נושא: ${d.topic || "לא סווג"} – ${d.subtopic || "לא סווג"}\n• מקום מגורים: ${d.reporter_city}\n• מקום האירוע: ${d.event_city}\n• טלפון: ${d.mobile}\n\nלאשר ולשלוח?`
    });
  }

  // שאלה לשלב הבא
  res.json({ reply: prompts[currentStep] });
});

// ===== הרצה מקומית =====
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
  });
}

export default app;
