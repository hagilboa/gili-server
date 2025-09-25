// בדיקת מספר טלפון ישראלי (נייד)
export function validateMobile(phone: string): boolean {
  // מסיר רווחים ותווים מיוחדים
  const cleaned = phone.replace(/\D/g, "");

  // בודק אם מתחיל ב-05 ויש לו 10 ספרות
  const regex = /^05\d{8}$/;
  return regex.test(cleaned);
}

// בדיקת טקסט כללי שאינו ריק
export function validateText(value: string): boolean {
  return value.trim().length > 0;
}

// בדיקת שם פרטי/משפחה (אותיות בלבד, לפחות תו אחד)
export function validateName(name: string): boolean {
  const regex = /^[\p{L}\s'-]+$/u; // תומך בעברית, אנגלית ותווים מיוחדים בסיסיים
  return regex.test(name.trim());
}
