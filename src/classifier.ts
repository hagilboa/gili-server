// src/classifier.ts
import * as XLSX from "xlsx";
import path from "path";

type TaxRow = {
  topic: string;
  subtopic: string;
  keywords: string[];
};

let CACHE: TaxRow[] | null = null;

// קורא את האקסל פעם אחת ומטמון בזיכרון
function loadTaxonomy(): TaxRow[] {
  if (CACHE) return CACHE;

  const filePath = path.join(process.cwd(), "data", "topics_subtopics_clean.xlsx");
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  // גמיש לשמות עמודות אפשריים: אנגלית/עברית
  CACHE = rows.map((r) => {
    const topic =
      r.topic || r.Topic || r["נושא"] || "לא מסווג";
    const subtopic =
      r.subtopic || r.Subtopic || r["תת נושא"] || "לא מסווג";

    const kwsCell = r.keywords || r.Keywords || r["מילות מפתח"] || "";
    const keywords = String(kwsCell)
      .split(",")
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);

    return { topic, subtopic, keywords };
  });

  return CACHE!;
}

// סיווג טקסט לפי מילות מפתח מהאקסל
export function classifyText(text: string): { topic: string; subtopic: string } {
  const taxonomy = loadTaxonomy();
  const t = (text || "").toLowerCase();

  for (const row of taxonomy) {
    if (row.keywords.length && row.keywords.some((kw) => t.includes(kw))) {
      return { topic: row.topic, subtopic: row.subtopic };
    }
  }
  return { topic: "לא מסווג", subtopic: "לא מסווג" };
}
