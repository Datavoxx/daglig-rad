import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL = "https://datavox.app.n8n.cloud/webhook/error-byggio";

interface ErrorReport {
  function_name: string;
  error_message: string;
  error_stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  severity: "error" | "warning" | "critical";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const errorReport: ErrorReport = await req.json();

    console.log(`[ERROR REPORT] ${errorReport.function_name}: ${errorReport.error_message}`);

    // Send to n8n webhook
    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...errorReport,
        environment: Deno.env.get("ENVIRONMENT") || "production",
        project: "byggio",
      }),
    });

    if (!webhookResponse.ok) {
      console.error("Failed to send to n8n:", await webhookResponse.text());
    } else {
      console.log("Error report sent to n8n successfully");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Only log here, no recursive reporting
    console.error("Error in report-error function:", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
