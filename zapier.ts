import fetch from "node-fetch";
import { config } from "./config.js";

export async function sendToZapier(payload: Record<string, unknown>) {
  const res = await fetch(config.zapierHook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Zapier error, status ${res.status}, body: ${body}`);
  }
}
