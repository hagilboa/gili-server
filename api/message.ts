// api/message.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as XLSX from 'xlsx';
import path from 'path';

// ---------- CORS ----------
const ORIGIN_ALLOWLIST = (process.env.ORIGIN_ALLOWLIST || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function originAllowed(origin?: string | null) {
  if (!origin) return false;
  if (ORIGIN_ALLOWLIST.includes('*')) return true;
  return ORIGIN_ALLOWLIST.includes(origin);
}

function setCors(res: VercelResponse, origin?: string | null) {
  if (origin && originAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ---------- סשנים בזיכרון (לבדיקות/POC) ----------
type Session = {
  step: number;
  data: {
    first_name?: string;
    last_name?: string;
    mobile?: string;
    reporter_city?: string;
    event_city?: string;
    description?: string;
    attachment?: string | null;
    topic?: string;
    subtopic?: string;
  };
};
const sessions = new Map<string, Session>();

// ---------- סיווג מאקסל ----------
type Pair = { topic: string; subtopic: string };
let pairs: Pair[] = [];

function normalizeHeb(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\u0590-\u05FF0-9\s/,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadTaxonomyOnce() {
  if (pairs.length) return;
  try {
    const file = path.resolve(process.cwd(), 'data', 'topics_subtopics_clean.xlsx');
    const wb = XLSX.readFile(file);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
    pairs = rows
      .map(r => ({
        topic: String(r['נושא'] || '').trim(),
        subtopic: String(r['תת נושא'] || '').trim()
      }))
      .filter(p => p.topic && p.subtopic);
  } catch (e) {
    console.error('failed to load taxonomy:', e);
    pairs = [];
  }
}

function classify(text: string, minScore = Number(process.env.CLASSIFIER_MIN_SCORE || 1)) {
  loadTaxonomyOnce();
  const q = normalizeHeb(text);
  let best = { topic: 'לא סווג', subtopic: 'לא סווג', score: 0 };
  for (const p of pairs) {
    const cand = normalizeHeb(p.subtopic + ' ' + p.topic);
    let score = 0;
    for (const token of cand.split(/[,\s/]+/).filter(Boolean)) {
      if (token.length < 3) continue;
      if (q.includes(token)) score += Math.min(token.length, 6);
    }
    if (score > best.score) best = { ...p, score };
  }
  if (best.score < minScore) return { topic: 'לא סווג', subtopic: 'לא סווג' };
  return { topic: best.topic, subtopic: best.subtopic };
}

// ---------- ולידציה ----------
const mobileRe = /^(?:\+972|0)5\d{8}$/;

function nextPrompt(step: number) {
  switch (step) {
    case 0: return 'היי, אני גילי ממוקד מועצה אזורית הגלבוע 🌿, איך קוראים לך?';
    case 1: return 'תודה, מה שם המשפחה?';
    case 2: return 'מספר נייד ליצירת קשר (05XXXXXXXX או +9725XXXXXXX).';
    case 3: return 'מה מקום המגורים שלך?';
    case 4: return 'ובאיזה יישוב או רחוב התרחש האירוע?';
    case 5: return 'במה אפשר לעזור? תאר בקצרה את הפנייה.';
    case 6: return 'רוצה לצרף תמונה או מסמך? שלח קישור, ואם לא – כתוב "לא".';
    case 7: return 'לאשר ולשלוח?';
    default: return 'המשך';
  }
}

function summary(s: Session) {
  return [
    `תודה ${s.data.first_name}, ריכזתי את הפרטים:`,
    `• תיאור: ${s.data.description || ''}`,
    `• נושא: ${s.data.topic || 'לא סווג'} , ${s.data.subtopic || 'לא סווג'}`,
    `• מקום מגורים: ${s.data.reporter_city || ''}`,
    `• מקום האירוע: ${s.data.event_city || ''}`,
    `• טלפון: ${s.data.mobile || ''}`,
    `לאשר ולשלוח?`
  ].join('\n');
}

function buildPayload(s: Session) {
  return {
    first_name: s.data.first_name || '',
    last_name: s.data.last_name || '',
    mobile: s.data.mobile || '',
    reporter_city: s.data.reporter_city || '',
    event_city: s.data.event_city || '',
    description: s.data.description || '',
    attachment: s.data.attachment || '',
    topic: s.data.topic || 'לא סווג',
    subtopic: s.data.subtopic || 'לא סווג'
  };
}

async function sendToZapier(payload: any) {
  const hook = process.env.ZAPIER_HOOK_URL || '';
  if (!hook) throw new Error('ZAPIER_HOOK_URL missing');
  const resp = await fetch(hook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error(`Zapier error ${resp.status}: ${t}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res, req.headers.origin || null);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId, text, attachmentUrl } = (req.body || {}) as {
    sessionId?: string; text?: string; attachmentUrl?: string;
  };
  if (!sessionId) return res.status(400).json({ error: 'sessionId נדרש' });

  if (!sessions.has(sessionId)) sessions.set(sessionId, { step: 0, data: {} });
  const s = sessions.get(sessionId)!;

  // פתיחה
  if (s.step === 0 && !text) {
    s.step = 1;
    return res.json({ reply: nextPrompt(0) });
  }

  // קבלת תשובה לפי שלבים
  switch (s.step) {
    case 1: s.data.first_name = text || ''; s.step++; return res.json({ reply: nextPrompt(1) });
    case 2: s.data.last_name = text || ''; s.step++; return res.json({ reply: nextPrompt(2) });
    case 3:
      if (!text || !mobileRe.test(text)) {
        return res.json({ reply: 'מספר לא תקין, הזן 05XXXXXXXX או +9725XXXXXXX.' });
      }
      s.data.mobile = text; s.step++; return res.json({ reply: nextPrompt(3) });
    case 4: s.data.reporter_city = text || ''; s.step++; return res.json({ reply: nextPrompt(4) });
    case 5: s.data.event_city = text || ''; s.step++; return res.json({ reply: nextPrompt(5) });
    case 6:
      s.data.description = text || '';
      const c = classify(s.data.description!);
      s.data.topic = c.topic; s.data.subtopic = c.subtopic;
      s.step++; return res.json({ reply: nextPrompt(6) });
    case 7:
      s.data.attachment = (text && text.trim() !== '' && text.trim() !== 'לא') ? (text.trim() || attachmentUrl || null) : null;
      s.step++; return res.json({ reply: summary(s) });
    case 8: {
      const ans = (text || '').trim();
      if (ans === 'כן') {
        const payload = buildPayload(s);
        try {
          await sendToZapier(payload);
          sessions.delete(sessionId);
          return res.json({ reply: '✔️ הפנייה נשלחה למוקד. תודה!' });
        } catch (e: any) {
          console.error(e);
          return res.status(502).json({ error: 'שגיאה בשליחה ל-Zapier. נסה שוב מאוחר יותר.' });
        }
      } else if (ans === 'לא') {
        // חזרה לתיאור (אפשר לערוך כל שדה אם תרצה; כאן חוזרים לתיאור)
        s.step = 6;
        return res.json({ reply: 'אין בעיה, עדכן את תיאור הפנייה.' });
      } else {
        return res.json({ reply: 'כדי להמשיך צריך תשובה "כן" או "לא".' });
      }
    }
    default:
      return res.json({ reply: 'המשך' });
  }
}
