// api/message.ts

const XLSX = require("xlsx");
const path = require("path");
import type { VercelRequest, VercelResponse } from "@vercel/node";

// פונקציה לטעינת הטקסונומיה מתוך הקובץ אקסל
function loadTaxonomy() {
  const filePath = path.join(process.cwd(), "data", "topics_subtopics_clean.xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  return rows.map((row) => ({
    topic: row["נושא"],
    subtopic: row["תת נושא"],
  }));
}

// סיווג לפי מחרוזת טקסט
function classifyText(text: string, taxonomy: { topic: string; subtopic: string }[]) {
  for (const entry of taxonomy) {
    if (
      text.includes(entry.topic) ||
      text.includes(entry.subtopic)
    ) {
      return entry;
    }
  }
  return { topic: "לא מסווג", subtopic: "לא מסווג" };
}

// נקודת קצה API
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sessionId, text } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    // טען טקסונומיה
    const taxonomy = loadTaxonomy();

    // סווג טקסט אם יש
    let classification = { topic: "", subtopic: "" };
    if (text) {
      classification = classifyText(text, taxonomy);
    }

    // תשובה
    return res.status(200).json({
      reply: "קיבלתי ✅",
      sessionId,
      classification,
    });
  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}
