import * as XLSX from "xlsx";
import path from "path";

interface Classification {
  topic: string;
  subtopic: string;
}

let taxonomy: { topic: string; subtopic: string; keywords: string[] }[] = [];

// טעינת אקסל
export function loadTaxonomy() {
  try {
    const filePath = path.join(process.cwd(), "data", "topics_subtopics_clean.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    taxonomy = rows.map((row) => ({
      topic: row["Topic"] || "לא מסווג",
      subtopic: row["Subtopic"] || "לא מסווג",
      keywords: (row["Keywords"] || "")
        .toString()
        .split(",")
        .map((k: string) => k.trim().toLowerCase()),
    }));

    console.log("Taxonomy loaded ✅", taxonomy.length);
  } catch (err) {
    console.error("❌ Failed to load taxonomy:", err);
  }
}

// סיווג טקסט
export function classifyText(text: string): Classification {
  if (!taxonomy.length) loadTaxonomy();

  const lowerText = text.toLowerCase();

  for (const item of taxonomy) {
    if (item.keywords.some((kw) => lowerText.includes(kw))) {
      return { topic: item.topic, subtopic: item.subtopic };
    }
  }

  return { topic: "לא מסווג", subtopic: "לא מסווג" };
}
