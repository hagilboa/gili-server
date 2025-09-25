// src/validators.ts

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, "");
  const isValid = /^05\d{8,9}$/.test(cleaned);
  console.log("📞 Phone validation:", phone, "=>", isValid);
  return isValid;
}
