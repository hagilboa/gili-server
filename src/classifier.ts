import path from "path";
import xlsx from "xlsx";

type Pair = {
  topic: string;
  subtopic: string;
  keywords: string[];
};

let pairs: Pair[] = [];

try {
  // בונים נתיב מלא לקובץ
  const filePath = path.join(process.cwd(), "data", "topics_subtopics_clean.xlsx");
  console.log("🔎 Loading classifier data from:", filePath);

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);

  pairs = rows.map((row: any) => ({
    topic: row.topic || "",
    subtopic: row.subtopic || "",
    keywords: (row.keywords || "")
      .toString()
      .split(",")
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0)
  }));

  console.log("✅ Loaded classifier pairs:", pairs.length);
  if (pairs.length > 0) {
    console.log("👉 Example pairs:", pairs.slice(0, 3)); // 3 הראשונים לדוגמה
  }
} catch (err) {
  console.error("❌ Error loading classifier Excel file:", err);
}

export function classify(text: string, minScore = Number(process.env.CLASSIFIER_MIN_SCORE || 1)) {
  console.log("📥 Classifying text:", text);

  let best: { topic: string; subtopic: string; score: number } | null = null;

  for (const pair of pairs) {
    let score = 0;
    for (const kw of pair.keywords) {
      if (text.includes(kw)) {
        score++;
      }
    }
    if (!best || score > best.score) {
      best = { topic: pair.topic, subtopic: pair.subtopic, score };
    }
  }

  if (best && best.score >= minScore) {
    console.log("✅ Matched:", best);
    return { topic: best.topic, subtopic: best.subtopic };
  }

  console.warn("⚠️ No classification found, returning 'לא סווג'");
  return { topic: "לא סווג", subtopic: "לא סווג" };
}
