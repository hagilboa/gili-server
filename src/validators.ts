// src/validators.ts

// בדיקת מספר נייד ישראלי
export function validateMobile(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, "");
  const isValid = /^05\d{8,9}$/.test(cleaned);
  console.log("📞 Mobile validation:", phone, "=>", isValid);
  return isValid;
}
