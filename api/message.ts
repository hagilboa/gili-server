import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const body = req.body || {};
    return res.status(200).json({
      reply: `קיבלתי את ההודעה עם sessionId: ${body.sessionId || 'ללא'}`
    });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
