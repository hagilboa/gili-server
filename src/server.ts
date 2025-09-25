import express from "express";
import bodyParser from "body-parser";
import { classify } from "./classifier";
import { validatePhone } from "./validators";
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

// API לניהול השיחה
app.post("/api/message", async (req, res) => {
  const { sessionId, text } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  // אם אין סשן חדש – נתחיל מהתחלה
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { stepIndex: 0, data: {} });
  }

  const session = sessions.get(sessionId);
  let currentStep = steps[session.stepIndex];

  // אם יש טקסט – שומרים לפי השלב
  if (text) {
    if (currentStep === "mobile") {
      if (!validatePhone(text)) {
        return res.json({ reply: "מספר הטלפון לא תקין, נסה שוב בבקשה" });
      }
    }

    if (currentStep === "attachment" && text.toLowerCase() === "לא") {
      session.data.attachment = "";
    } else if (currentStep === "attachment" && text.toLowerCase() !== "לא") {
      session.data.attachment = text; // אפשר לשים לינק/קובץ
    } else {
      session.data[currentStep] = text;
    }

    session.stepIndex++;
    currentStep = steps[session.stepIndex];
  }

  // אם סיימנו את השיחה
  if (!currentStep) {
    const data = session.data;

    // סיווג הנושא
    const { topic, subtopic } = classify(data.description || "");

    data.topic = topic;
    data.subtopic = subtopic;

    // שולחים ל־Zapier
    await sendToZapier(data);

    // מנקים סשן
    sessions.delete(sessionId);

    return res.json({
      reply: `תודה ${data.first_name}, הפנייה שלך נשלחה למוקד ✅`
    });
  }

  // מקרה מיוחד – אישור
  if (currentStep === "confirm") {
    const d = session.data;
    return res.json({
      reply: `תודה ${d.first_name}, ריכזתי את הפנייה שלך:\n• תיאור: ${d.description}\n• נושא: ${d.topic || "לא סווג"} – ${d.subtopic || "לא סווג"}\n• מקום מגורים: ${d.reporter_city}\n• מקום האירוע: ${d.event_city}\n• טלפון: ${d.mobile}\n\nלאשר ולשלוח?`
    });
  }

  // מחזירים את ההנחיה לשלב הנוכחי
  res.json({ reply: prompts[currentStep] });
});

// הרצה מקומית
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

export default app;
