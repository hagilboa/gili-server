import * as XLSX from "xlsx";
import path from "path";

export interface TaxonomyItem {
  topic: string;
  subtopic: string;
  keywords: string[];
}

export function loadTaxonomy(): TaxonomyItem[] {
  const filePath = path.join(process.cwd(), "data", "topics_subtopics_clean.xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet) as TaxonomyItem[];
}

export function classifyWithTaxonomy(text: string, taxonomy: TaxonomyItem[]) {
  const lowerText = text.toLowerCase();

  for (const item of taxonomy) {
    if (item.keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return { topic: item.topic, subtopic: item.subtopic };
    }
  }

  return { topic: "לא מסווג", subtopic: "לא מסווג" };
}
