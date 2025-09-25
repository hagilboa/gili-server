// api/message.ts

const XLSX = require("xlsx");
const path = require("path");

// פונקציה לטעינת טקסונומיה מתוך קובץ Excel
function loadTaxonomy() {
  try {
    const filePath = path.join(process.cwd(), "data", "topics_subtopics_clean.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    return rows.map((row) => ({
      topic: row["נושא"],
      subtopic: row["תת נושא"],
    }));
  } catch (err) {
    console.error("שגיאה בטעינת הטקסונומיה:", err);
    return [];
  }
}

// פונקציה פשוטה לסיווג טקסט
function classifyText(text: string, taxonomy: { topic: string; subtopic: string }[]) {
  for (const entry of taxonomy) {
    if (text.includes(entry.topic) || text.includes(entry.subtopic)) {
      return entry;
    }
  }
  return { topic: "לא מסווג", subtopic: "לא מסווג" };
}

// הפונקציה הראשית של ה־API
function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sessionId, text } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const taxonomy = loadTaxonomy();
    let classification = { topic: "", subtopic: "" };

    if (text) {
      classification = classifyText(text, taxonomy);
    }

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

// יצוא ב־CommonJS
module.exports = handler;
