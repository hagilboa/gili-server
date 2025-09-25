import * as XLSX from "xlsx";
import { config } from "./config.js";

type Pair = { topic: string, subtopic: string };

let pairs: Pair[] = [];

function normalizeHeb(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\\u0590-\\u05FF0-9\\s/,-]/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}

export function loadTaxonomy(filePath = "data/topics_subtopics_clean.xlsx") {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
  pairs = rows
    .map(r => ({
      topic: String(r["נושא"] || "").trim(),
      subtopic: String(r["תת נושא"] || "").trim()
    }))
    .filter(p => p.topic && p.subtopic);
}

export function classify(text: string): { topic: string, subtopic: string, score: number } {
  const q = normalizeHeb(text);
  let best = { topic: "לא סווג", subtopic: "לא סווג", score: 0 };

  for (const p of pairs) {
    const cand = normalizeHeb(p.subtopic + " " + p.topic);
    let score = 0;
    for (const token of cand.split(/[,\s/]+/).filter(Boolean)) {
      if (token.length < 3) continue;
      if (q.includes(token)) score += Math.min(token.length, 6);
    }
    if (score > best.score) best = { ...p, score };
  }

  if (best.score < config.classifierMinScore) {
    return { topic: "לא סווג", subtopic: "לא סווג", score: best.score };
  }
  return best;
}
