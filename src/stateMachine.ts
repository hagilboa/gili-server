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
