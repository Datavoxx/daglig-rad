import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function reportError(
  functionName: string, 
  error: unknown, 
  context?: Record<string, unknown>
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    await fetch(`${supabaseUrl}/functions/v1/report-error`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        function_name: functionName,
        error_message: error instanceof Error ? error.message : String(error),
        error_stack: error instanceof Error ? error.stack : undefined,
        context,
        timestamp: new Date().toISOString(),
        severity: "error",
      }),
    });
  } catch (reportErr) {
    console.error("Failed to report error:", reportErr);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: "Transcript is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Du heter Saga och är en expert på offerter, kalkyler och kalkylmallar för byggprojekt. Du tolkar röstinput för att skapa offertmallar.

Baserat på användarens beskrivning, extrahera:
1. Mallnamn (name)
2. Beskrivning (description) - kort sammanfattning
3. Timpriser (hourly_rates) - objekt med resurstyp som nyckel och timpris i SEK som värde
4. Arbetsmoment (work_items) - lista med WBS-strukturerade moment
5. Materialkostnader (cost_library) - lista med material och enhetspriser

För work_items, varje moment ska ha:
- wbs: WBS-nummer (t.ex. "2.1", "3.1")
- name: Momentnamn
- unit: Enhet (m², st, lpm, etc.)
- resource: Resurstyp som matchar hourly_rates
- hours_per_unit: Uppskattade timmar per enhet

Vanliga moment för badrumsrenovering:
- Rivning (0.8-1.0 h/m²)
- Underarbete vägg/golv (0.5-0.7 h/m²)
- Tätskikt golv/vägg (0.6-0.8 h/m²)
- Kakel/klinker (0.8-1.2 h/m²)
- VVS-arbeten (8-12 h/st)
- El-arbeten (4-8 h/st)

Returnera ENDAST ett JSON-objekt utan markdown-formatering:
{
  "name": "string",
  "description": "string",
  "hourly_rates": {"resurs": number},
  "work_items": [{"wbs": "string", "name": "string", "unit": "string", "resource": "string", "hours_per_unit": number}],
  "cost_library": [{"id": "string", "name": "string", "unit": "string", "price": number}],
  "material_spill_percent": 7,
  "overhead_percent": 12,
  "risk_percent": 8,
  "profit_percent": 10,
  "vat_percent": 25,
  "establishment_cost": 4500
}`;

    const _aiStartTime = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Tolka denna mallbeskrivning:\n\n${transcript}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    // Parse the JSON response
    let parsed;
    try {
      // Remove potential markdown code blocks
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Ensure required fields with defaults
    const template = {
      name: parsed.name || "Ny mall",
      description: parsed.description || "",
      hourly_rates: parsed.hourly_rates || {},
      work_items: parsed.work_items || [],
      cost_library: parsed.cost_library || [],
      material_spill_percent: parsed.material_spill_percent ?? 7,
      overhead_percent: parsed.overhead_percent ?? 12,
      risk_percent: parsed.risk_percent ?? 8,
      profit_percent: parsed.profit_percent ?? 10,
      vat_percent: parsed.vat_percent ?? 25,
      establishment_cost: parsed.establishment_cost ?? 4500,
    };

    // Log AI usage (enhanced)
    try {
      const _aiEndTime = Date.now();
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const svcClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
        const { data: userData } = await userClient.auth.getUser();
        if (userData?.user) {
          await svcClient.from("ai_usage_logs").insert({ user_id: userData.user.id, function_name: "parse-template-voice", model: "google/gemini-2.5-flash", tokens_in: aiResponse.usage?.prompt_tokens, tokens_out: aiResponse.usage?.completion_tokens, response_time_ms: _aiEndTime - _aiStartTime, output_size: content?.length || 0 });
        }
      }
    } catch (_) {}

    return new Response(JSON.stringify(template), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in parse-template-voice:", error);
    await reportError("parse-template-voice", error, { endpoint: "parse-template-voice" });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
