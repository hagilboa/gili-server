import type { SessionData } from "./types.js";
import { validateMobile } from "./validators.js";
import { classify } from "./classifier.js";

export const steps = [
  "first_name",
  "last_name",
  "mobile",
  "reporter_city",
  "event_city",
  "description",
  "attachment",
  "summary_confirm"
] as const;

export function initSession(): SessionData {
  return { step: 0, data: {} };
}

export function nextPrompt(s: SessionData): string {
  switch (steps[s.step]) {
    case "first_name": return "היי, אני גילי ממוקד מועצה אזורית הגלבוע, איך קוראים לך?";
    case "last_name": return "תודה, מה שם המשפחה?";
    case "mobile": return "מספר נייד ליצירת קשר, בבקשה.";
    case "reporter_city": return "מה מקום המגורים שלך?";
    case "event_city": return "ובאיזה יישוב או רחוב התרחש האירוע?";
    case "description": return "תאר בקצרה את הפנייה, מה צריך לטפל?";
    case "attachment": return "רוצה לצרף תמונה או מסמך? אפשר לשלוח לינק, אם לא אז כתוב לא.";
    case "summary_confirm": return "לאשר ולשלוח?";
    default: return "המשך";
  }
}

export function absorbAnswer(s: SessionData, text?: string, attachmentUrl?: string): { reply: string, done: boolean } {
  const stepKey = steps[s.step];

  if (stepKey !== "attachment" && !text) {
    return { reply: "לא קיבלתי תשובה, אפשר לחזור על זה?", done: false };
  }

  switch (stepKey) {
    case "first_name": s.data.first_name = text!; s.step++; break;
    case "last_name": s.data.last_name = text!; s.step++; break;
    case "mobile": {
      const v = validateMobile(text!);
      if (!v.success) return { reply: "מספר לא תקין, אנא הזן בפורמט 05XXXXXXXX או +9725XXXXXXX.", done: false };
      s.data.mobile = text!; s.step++; break;
    }
    case "reporter_city": s.data.reporter_city = text!; s.step++; break;
    case "event_city": s.data.event_city = text!; s.step++; break;
    case "description":
      s.data.description = text!;
      const c = classify(text!);
      s.data.topic = c.topic; s.data.subtopic = c.subtopic; s.step++; break;
    case "attachment":
      s.data.attachment = (text && text.trim() !== "" && text.trim() !== "לא") ? text!.trim() : null;
      s.step++; break;
    case "summary_confirm":
      if (text!.trim() === "כן") return { reply: "מאשר, שולח למוקד.", done: true };
      if (text!.trim() === "לא") { s.step = steps.indexOf("description"); return { reply: "אין בעיה, בוא נעדכן את התיאור או שדות אחרים.", done: false }; }
      return { reply: "להמשיך רק לאחר אישור, כתוב כן או לא.", done: false };
  }

  return { reply: nextPrompt(s), done: false };
}

export function buildPayload(s: SessionData) {
  return {
    first_name: s.data.first_name || "",
    last_name: s.data.last_name || "",
    mobile: s.data.mobile || "",
    reporter_city: s.data.reporter_city || "",
    event_city: s.data.event_city || "",
    description: s.data.description || "",
    attachment: s.data.attachment || "",
    topic: s.data.topic || "לא סווג",
    subtopic: s.data.subtopic || "לא סווג"
  };
}

export function buildSummary(s: SessionData): string {
  return [
    `תודה ${s.data.first_name}, ריכזתי את הפרטים:`,
    `• תיאור: ${s.data.description}`,
    `• נושא: ${s.data.topic} , ${s.data.subtopic}`,
    `• מקום מגורים: ${s.data.reporter_city}`,
    `• מקום האירוע: ${s.data.event_city}`,
    `• טלפון: ${s.data.mobile}`,
    `לאשר ולשלוח?`
  ].join("\\n");
}
