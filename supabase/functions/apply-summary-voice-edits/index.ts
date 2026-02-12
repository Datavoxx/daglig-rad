/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

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

interface SummaryData {
  scope: string;
  assumptions: string[];
  uncertainties: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, currentData } = await req.json() as {
      transcript: string;
      currentData: SummaryData;
    };

    if (!transcript?.trim()) {
      return new Response(
        JSON.stringify({ error: "Ingen transkription angiven" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `Du heter Saga och är en expert på offerter och kalkyler för byggprojekt. Du hjälper till att uppdatera projektbeskrivningar och tidsplaner baserat på röstkommandon.

Du får:
1. En transkription av ett röstkommando
2. Nuvarande data (scope, assumptions, uncertainties)

Din uppgift:
- Tolka vad användaren vill ändra
- Returnera uppdaterad data

TIDSPLAN (assumptions):
- När användaren nämner "tidsplan", "tidplan", "veckor", "dagar" ska detta gå till assumptions-arrayen
- Exempel: "Tidsplan två veckor" → assumptions: ["Totalt 2 veckor"]
- Exempel: "Vecka ett rivning, vecka två bygge" → assumptions: ["Vecka 1: Rivning", "Vecka 2: Bygge"]
- Tidsplan-information ska ALDRIG hamna i scope, scope är bara projektbeskrivning

Exempel på kommandon:
- "Ändra omfattningen till badrumsrenovering i stället"
- "Tidsplan: två veckor" → assumptions: ["2 veckor"]
- "Ta bort osäkerheten om el"
- "Vecka ett rivning, vecka två målning" → assumptions: ["Vecka 1: Rivning", "Vecka 2: Målning"]

Returnera ENDAST giltig JSON med denna struktur:
{
  "scope": "uppdaterad text eller samma som innan",
  "assumptions": ["Vecka 1: Moment A", "Vecka 2: Moment B"],
  "uncertainties": ["array", "med", "osäkerheter"],
  "changes_made": "kort beskrivning av vad du ändrade"
}`;

    const userPrompt = `Röstkommando: "${transcript}"

Nuvarande data:
- Projektbeskrivning: ${currentData.scope}
- Tidsplan: ${JSON.stringify(currentData.assumptions)}
- Osäkerheter: ${JSON.stringify(currentData.uncertainties)}

Tolka kommandot och returnera uppdaterad data.`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable API error:", errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Kunde inte tolka svaret från AI");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Log AI usage
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const svcClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
        const { data: userData } = await userClient.auth.getUser();
        if (userData?.user) {
          await svcClient.from("ai_usage_logs").insert({ user_id: userData.user.id, function_name: "apply-summary-voice-edits", model: "openai/gpt-5-mini" });
        }
      }
    } catch (_) {}

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in apply-summary-voice-edits:", error);
    await reportError("apply-summary-voice-edits", error, { endpoint: "apply-summary-voice-edits" });
    const message = error instanceof Error ? error.message : "Ett fel uppstod";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
