import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const WEBHOOK_URL = "https://datavox.app.n8n.cloud/webhook/utbildning";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type BookingPayload = {
  name: string;
  email: string;
  phone: string;
  training_duration: "30 min" | "60 min" | string;
  preferred_date: string; // yyyy-MM-dd
  preferred_time: string; // HH:mm
  requested_at: string; // ISO
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(email: string) {
  // basic sanity check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      console.error("[training-booking] invalid_json", { requestId });
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = body as Partial<BookingPayload>;

    const missing: string[] = [];
    if (!isNonEmptyString(payload.name)) missing.push("name");
    if (!isNonEmptyString(payload.email)) missing.push("email");
    if (!isNonEmptyString(payload.phone)) missing.push("phone");
    if (!isNonEmptyString(payload.training_duration)) missing.push("training_duration");
    if (!isNonEmptyString(payload.preferred_date)) missing.push("preferred_date");
    if (!isNonEmptyString(payload.preferred_time)) missing.push("preferred_time");

    if (missing.length > 0) {
      console.error("[training-booking] missing_fields", { requestId, missing });
      return new Response(JSON.stringify({ error: "Missing required fields", fields: missing }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isValidEmail(payload.email!.trim())) {
      console.error("[training-booking] invalid_email", { requestId });
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const forwardPayload: BookingPayload = {
      name: payload.name!.trim().slice(0, 100),
      email: payload.email!.trim().slice(0, 255),
      phone: payload.phone!.trim().slice(0, 30),
      training_duration: String(payload.training_duration).slice(0, 20),
      preferred_date: payload.preferred_date!.trim().slice(0, 20),
      preferred_time: payload.preferred_time!.trim().slice(0, 10),
      requested_at: isNonEmptyString(payload.requested_at) ? payload.requested_at : new Date().toISOString(),
    };

    console.log("[training-booking] forward_start", {
      requestId,
      date: forwardPayload.preferred_date,
      time: forwardPayload.preferred_time,
      duration: forwardPayload.training_duration,
    });

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwardPayload),
    });

    const responseText = await webhookResponse.text().catch(() => "");

    if (!webhookResponse.ok) {
      console.error("[training-booking] webhook_failed", {
        requestId,
        status: webhookResponse.status,
        body: responseText?.slice(0, 1000),
      });

      return new Response(
        JSON.stringify({
          error: "Webhook request failed",
          status: webhookResponse.status,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("[training-booking] forward_ok", { requestId });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[training-booking] unhandled_error", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
