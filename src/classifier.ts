import * as XLSX from "xlsx";
import path from "path";

interface Taxonomy {
  topic: string;
  subtopic: string;
}

let taxonomy: Taxonomy[] = [];

// טוען את קובץ האקסל
export function loadTaxonomy() {
  const filePath = path.join(process.cwd(), "data", "topics_subtopics_clean.xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  taxonomy = XLSX.utils.sheet_to_json(sheet) as Taxonomy[];
}

// מסווג טקסט לקטגוריה
export function classifyText(text: string): Taxonomy {
  if (!taxonomy.length) {
    loadTaxonomy();
  }

  const found = taxonomy.find(
    (row) =>
      text.includes(row.topic) ||
      text.includes(row.subtopic)
  );

  return found || { topic: "לא מסווג", subtopic: "לא מסווג" };
}
