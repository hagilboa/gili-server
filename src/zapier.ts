import axios from "axios";

const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL || "";

/**
 * שולח פנייה אל Zapier Webhook
 */
export async function sendToZapier(data: any) {
  if (!ZAPIER_WEBHOOK_URL) {
    console.error("❌ Zapier Webhook URL is not defined in ENV");
    return;
  }

  try {
    console.log("📤 Preparing to send to Zapier:", JSON.stringify(data, null, 2));

    const response = await axios.post(ZAPIER_WEBHOOK_URL, data, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Zapier response status:", response.status);
    console.log("✅ Zapier response data:", response.data);
  } catch (error: any) {
    console.error("❌ Error sending to Zapier:", error.message || error);
    if (error.response) {
      console.error("❌ Zapier error response:", error.response.data);
    }
  }
}
