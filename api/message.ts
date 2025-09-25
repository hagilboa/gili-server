import type { VercelRequest, VercelResponse } from '@vercel/node';

// ניהול סטייט בסיסי בזיכרון (לבדיקות)
const sessions: Record<string, any> = {};

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, text } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  // אם אין סשן – נתחיל חדש
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      step: 0,
      data: {}
    };
  }

  const session = sessions[sessionId];

  // מהלך השיחה
  const steps = [
    "היי, אני גילי ממוקד מועצה אזורית הגלבוע 🌿. איך קוראים לך?",
    "מה שם המשפחה שלך?",
    "מה מספר הטלפון שלך?",
    "באיזה יישוב אתה גר?",
    "באיזה יישוב קרה האירוע?",
    "במה אפשר לעזור? ספר לי בקצרה.",
    "רוצה לצרף תמונה או מסמך? (אם כן, שלח קישור, אם לא כתוב 'לא')",
    "תודה! לאשר ולשלוח את הפנייה?"
  ];

  // אם זה שלב ראשון
  if (session.step === 0) {
    session.step++;
    return res.json({ reply: steps[0] });
  }

  // לשמור תשובה
  switch (session.step) {
    case 1:
      session.data.first_name = text;
      break;
    case 2:
      session.data.last_name = text;
      break;
    case 3:
      session.data.mobile = text;
      break;
    case 4:
      session.data.reporter_city = text;
      break;
    case 5:
      session.data.event_city = text;
      break;
    case 6:
      session.data.description = text;
      break;
    case 7:
      if (text && text.toLowerCase() !== 'לא') {
        session.data.attachment = text;
      }
      break;
    case 8:
      if (text && text.toLowerCase() === 'כן') {
        // כאן שולחים ל-Zapier Webhook (בהמשך נוסיף fetch)
        return res.json({
          reply: "הפנייה נשלחה בהצלחה ✅",
          data: session.data
        });
      } else {
        return res.json({
          reply: "בוטל, אפשר להתחיל מחדש אם תרצה."
        });
      }
  }

  session.step++;
  return res.json({ reply: steps[session.step - 1] });
}
