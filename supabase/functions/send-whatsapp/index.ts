/// <reference lib="deno.ns" />
/// <reference lib="dom" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type WhatsAppRequest = {
  to?: string;
  text?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!token || !phoneNumberId) {
    return jsonResponse(
      { error: "WhatsApp service is not configured." },
      500
    );
  }

  let payload: WhatsAppRequest;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body." }, 400);
  }

  const to = normalizePhone(String(payload.to || ""));
  const text = String(payload.text || "").trim();

  if (!to || !text) {
    return jsonResponse(
      { error: "Missing WhatsApp recipient or message text." },
      400
    );
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: text
        }
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    return jsonResponse(
      {
        error: "WhatsApp provider rejected the request.",
        details: result
      },
      response.status
    );
  }

  return jsonResponse({
    ok: true,
    result
  });
});
