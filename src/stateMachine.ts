import { validateMobile } from "./validators";

export type Step =
  | "first_name"
  | "last_name"
  | "mobile"
  | "reporter_city"
  | "event_city"
  | "description"
  | "attachment"
  | "confirm";

export const steps: Step[] = [
  "first_name",
  "last_name",
  "mobile",
  "reporter_city",
  "event_city",
  "description",
  "attachment",
  "confirm"
];

// בדיקת ערך לשלב מסוים
export function isStepValid(step: Step, value: string): boolean {
  if (step === "mobile") {
    return validateMobile(value);
  }
  return value.trim().length > 0;
}

// לוגיקה שמנהלת את התקדמות השיחה
export function runStep(
  sessionId: string,
  step: Step,
  value: string,
  classification?: { topic: string; subtopic: string }
): string {
  switch (step) {
    case "first_name":
      return `תודה ${value}, מה שם המשפחה שלך?`;
    case "last_name":
      return `קיבלתי, מה מספר הטלפון הנייד שלך?`;
    case "mobile":
      return `מעולה, איפה אתה גר?`;
    case "reporter_city":
      return `איפה התרחש האירוע?`;
    case "event_city":
      return `תוכל לתאר בקצרה את הפנייה?`;
    case "description":
      return `רוצה לצרף תמונה או מסמך שיכול לעזור?`;
    case "attachment":
      return `הנה הסיכום: ${classification?.topic || "לא מסווג"} - ${classification?.subtopic || "לא מסווג"}. לאשר ולשלוח?`;
    case "confirm":
      return `הפנייה שלך נשלחה בהצלחה ✅ תודה!`;
    default:
      return "לא זיהיתי שלב מתאים";
  }
}
