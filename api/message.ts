import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

// מייבאים את הפונקציות שלך
import { classifyText } from "../src/classifier.js";
import { Step, isStepValid } from "../src/stateMachine.js";

// טוענים את קובץ האקסל פעם אחת ל־Memory
let taxonomy: { topic: string; subtopic: string; keywords: string[] }[] = [];

function loadTaxonomy() {
  if (taxonomy.length > 0) return taxonomy; // אם כבר טעון, מחזיר
  try {
    const filePath = path.join(process.cwd(), "data", "topics_subtopics_clean.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    taxonomy = rows.map((row) => ({
      topic: row["topic"] || "לא מסווג",
      subtopic: row["subtopic"] || "לא מסווג",
      keywords: (row["keywords"] || "")
        .toString()
        .split(",")
        .map((kw: string) => kw.trim())
        .filter((kw: string) => kw.length > 0),
    }));
  } catch (err) {
    console.error("שגיאה בטעינת קובץ האקסל:", err);
  }
  return taxonomy;
}

function classifyWithTaxonomy(message: string) {
  const rows = loadTaxonomy();
  const lowerMsg = message.toLowerCase();

  for (const row of rows) {
    if (row.keywords.some((kw) => lowerMsg.includes(kw.toLowerCase()))) {
      return { topic: row.topic, subtopic: row.subtopic };
    }
  }

  return { topic: "לא מסווג", subtopic: "לא מסווג" };
}

// -------------------
// נקודת API
// -------------------
export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // שימוש בסיווג עם אקסל
  const classification = classifyWithTaxonomy(message);

  res.status(200).json({
    reply: `קיבלתי ✅`,
    sessionId,
    classification,
  });
}
