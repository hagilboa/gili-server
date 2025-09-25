import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config.js";
import { initSession, absorbAnswer, buildPayload, buildSummary, nextPrompt } from "./stateMachine.js";
import { sendToZapier } from "./zapier.js";
import { loadTaxonomy } from "./classifier.js";
import type { MessageIn } from "./types.js";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(morgan("tiny"));
app.use(cors());

const sessions = new Map<string, ReturnType<typeof initSession>>();

loadTaxonomy();

app.post("/api/message", async (req, res) => {
  const { sessionId, text, attachmentUrl } = req.body as MessageIn;
  if (!sessionId) return res.status(400).json({ error: "sessionId נדרש" });

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, initSession());
  }
  const s = sessions.get(sessionId)!;

  if (s.step === 0 && !text) {
    return res.json({ reply: nextPrompt(s) });
  }

  const { reply, done } = absorbAnswer(s, text, attachmentUrl);

  if (!done) {
    if (s.step === 7) {
      return res.json({ reply: buildSummary(s) });
    }
    return res.json({ reply });
  }

  try {
    const payload = buildPayload(s);
    await sendToZapier(payload);
    sessions.delete(sessionId);
    return res.json({ reply: "הפנייה נשלחה למוקד, תודה רבה." });
  } catch (e: any) {
    console.error(e);
    return res.status(502).json({ error: "שגיאה בשליחה ל-Zapier." });
  }
});

app.listen(config.port, () => {
  console.log(`Gili server up on port ${config.port}`);
});
