import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL = "https://datavox.app.n8n.cloud/webhook/nytt-konto";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name, user_id } = await req.json();

    console.log(`[NEW ACCOUNT] Notifying webhook for: ${email}`);

    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        full_name,
        user_id,
        registered_at: new Date().toISOString(),
        source: "byggio-web",
      }),
    });

    if (!webhookResponse.ok) {
      console.error("Failed to send to n8n:", await webhookResponse.text());
    } else {
      console.log("New account notification sent to n8n successfully");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-new-account:", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
