/// <reference lib="deno.ns" />
/// <reference lib="dom" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type EmailRequest = {
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  replyTo?: string;
  senderName?: string;
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405
    );
  }

  const resendApiKey =
    Deno.env.get("RESEND_API_KEY");

  const fromEmail =
    Deno.env.get("EMAIL_FROM");

  if (!resendApiKey || !fromEmail) {
    return jsonResponse(
      { error: "Email service is not configured." },
      500
    );
  }

  let payload: EmailRequest;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      { error: "Invalid JSON request body." },
      400
    );
  }

  const to =
    String(payload.to || "").trim();

  const subject =
    String(payload.subject || "").trim();

  const text =
    String(payload.text || "").trim();

  const html =
    String(payload.html || "").trim();

  if (
    !isValidEmail(to) ||
    !subject ||
    (!text && !html)
  ) {
    return jsonResponse(
      { error: "Missing or invalid email fields." },
      400
    );
  }

  const body = {
    from: fromEmail,
    to: [to],
    subject,
    text,
    html,
    reply_to: payload.replyTo && isValidEmail(payload.replyTo)
      ? payload.replyTo
      : undefined
  };

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

  const result =
    await response.json();

  if (!response.ok) {
    return jsonResponse(
      {
        error: "Email provider rejected the request.",
        details: result
      },
      response.status
    );
  }

  return jsonResponse({
    ok: true,
    id: result.id
  });
});
