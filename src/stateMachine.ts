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

// פונקציה לבדיקת שלב
export function isStepValid(step: Step, value: string): boolean {
  if (step === "mobile") {
    return validateMobile(value);
  }
  return value.trim().length > 0;
}

// פונקציה לניהול שיחה (State Machine)
export function runStep(
  sessionId: string,
  text: string,
  classification: { topic: string; subtopic: string }
): string {
  // בשלב ראשון – תוכל להחזיר תשובה בסיסית
  // בהמשך נוסיף לוגיקה לניהול session

  if (!text || text.trim() === "") {
    return "מה תרצה לדווח?";
  }

  if (!classification || classification.topic === "לא מסווג") {
    return "קיבלתי ✅, תוכל להסביר קצת יותר?";
  }

  return `קיבלתי את הפנייה שלך בנושא "${classification.topic}" (${classification.subtopic}) ✅`;
}
