import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  preferred_date: string;
  preferred_time: string;
  requested_at: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req) => {
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

    const bookingData = {
      name: payload.name!.trim().slice(0, 100),
      email: payload.email!.trim().slice(0, 255),
      phone: payload.phone!.trim().slice(0, 30),
      training_duration: String(payload.training_duration).slice(0, 20),
      preferred_date: payload.preferred_date!.trim().slice(0, 20),
      preferred_time: payload.preferred_time!.trim().slice(0, 10),
    };

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to forward to webhook (best effort)
    let webhookStatus = "pending";
    let webhookResponse = "";

    try {
      console.log("[training-booking] forward_start", {
        requestId,
        date: bookingData.preferred_date,
        time: bookingData.preferred_time,
        duration: bookingData.training_duration,
      });

      const webhookResult = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingData,
          requested_at: new Date().toISOString(),
        }),
      });

      webhookResponse = await webhookResult.text().catch(() => "");
      
      if (webhookResult.ok) {
        webhookStatus = "success";
        console.log("[training-booking] webhook_success", { requestId });
      } else {
        webhookStatus = "failed";
        console.warn("[training-booking] webhook_failed", {
          requestId,
          status: webhookResult.status,
          body: webhookResponse?.slice(0, 500),
        });
      }
    } catch (webhookError) {
      webhookStatus = "error";
      webhookResponse = webhookError instanceof Error ? webhookError.message : String(webhookError);
      console.warn("[training-booking] webhook_error", { requestId, error: webhookResponse });
    }

    // Always save to database (this is the reliable storage)
    const { error: dbError } = await supabase.from("training_bookings").insert({
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      training_duration: bookingData.training_duration,
      preferred_date: bookingData.preferred_date,
      preferred_time: bookingData.preferred_time,
      webhook_status: webhookStatus,
      webhook_response: webhookResponse?.slice(0, 1000) || null,
    });

    if (dbError) {
      console.error("[training-booking] db_error", { requestId, error: dbError.message });
      return new Response(JSON.stringify({ error: "Failed to save booking" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[training-booking] booking_saved", { requestId, webhookStatus });

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