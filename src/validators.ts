import { z } from "zod";

export const mobileSchema = z.string().regex(/^(?:\\+972|0)5\\d{8}$/, "מספר נייד לא תקין");

export function validateMobile(m: string) {
  return mobileSchema.safeParse(m);
}
