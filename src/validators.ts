// בדיקת מספר טלפון ישראלי בסיסי
export function validateMobile(phone: string): boolean {
  if (!phone) return false;

  // מסיר רווחים, מקפים וסימנים מיוחדים
  const cleaned = phone.replace(/[\s-]/g, "");

  // תבנית: מתחיל ב-05 ומכיל 10 ספרות בסך הכל
  const regex = /^05\d{8}$/;

  return regex.test(cleaned);
}
