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

interface EstimateItem {
  id: string;
  moment: string;
  type: "labor" | "material" | "subcontractor";
  quantity: number | null;
  unit: string;
  hours: number | null;
  unit_price: number;
  subtotal: number;
  comment: string;
  uncertainty: "low" | "medium" | "high";
  sort_order: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, items, scope: currentScope, assumptions: currentAssumptions } = await req.json() as {
      transcript: string;
      items: EstimateItem[];
      scope?: string;
      assumptions?: string[];
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

    const systemPrompt = `Du heter Saga och är en expert på offerter och kalkyler för byggprojekt. Du hjälper till att uppdatera offertposter, projektbeskrivning och tidsplan baserat på röstkommandon.

Du får:
1. En transkription av ett röstkommando
2. Nuvarande kalkylposter (items)
3. Nuvarande projektbeskrivning (scope)
4. Nuvarande tidsplan (assumptions)

Din uppgift:
- Tolka vad användaren vill ändra
- Returnera uppdaterade items, scope och assumptions

Möjliga ändringar på items:
- Ändra mängd/antal för en post
- Ändra á-pris för en post
- Ändra timmar för en post
- Lägg till en ny post
- Ta bort en post
- Ändra osäkerhetsnivå (low/medium/high)

Möjliga ändringar på scope (projektbeskrivning):
- Skapa eller uppdatera projektbeskrivningen baserat på vad användaren säger

Möjliga ändringar på assumptions (tidsplan):
- Skapa eller uppdatera tidsplanen, varje punkt som en sträng i arrayen

Beräkna subtotal automatiskt:
- För arbete (labor): subtotal = hours * unit_price
- För material/ue: subtotal = quantity * unit_price
- Om unit är "klump": subtotal = unit_price

Returnera ENDAST giltig JSON med denna struktur:
{
  "items": [/* uppdaterade items med samma struktur som input */],
  "scope": "projektbeskrivning eller null om ingen ändring",
  "assumptions": ["Vecka 1: ...", "Vecka 2: ..."] eller null om ingen ändring,
  "changes_made": "kort beskrivning av vad du ändrade"
}

Behåll alla items som inte ändras. Generera nya UUID för nya poster med crypto.randomUUID() format.
Om användaren inte nämner scope eller assumptions, returnera null för dessa fält.`;

    const itemsSummary = items.map((item, i) => 
      `${i + 1}. ${item.moment} (${item.type}): ${item.quantity ?? '-'} ${item.unit}, ${item.hours ?? '-'} tim, ${item.unit_price} kr/enh, summa ${item.subtotal} kr`
    ).join('\n');

    const userPrompt = `Röstkommando: "${transcript}"

Nuvarande kalkylposter:
${itemsSummary}

Nuvarande projektbeskrivning (scope): ${currentScope || "(ingen)"}

Nuvarande tidsplan (assumptions): ${currentAssumptions?.length ? currentAssumptions.join(", ") : "(ingen)"}

Tolka kommandot och returnera uppdaterade items, scope och assumptions.

VIKTIGT: Returnera alla items (även de som inte ändras) med komplett struktur.`;

    const _aiStartTime = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        max_completion_tokens: 4000,
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

    // Ensure all items have required fields
    if (result.items) {
      result.items = result.items.map((item: any, index: number) => ({
        id: item.id || crypto.randomUUID(),
        moment: item.moment || "",
        type: item.type || "labor",
        quantity: item.quantity ?? null,
        unit: item.unit || "tim",
        hours: item.hours ?? null,
        unit_price: Number(item.unit_price) || 0,
        subtotal: Number(item.subtotal) || 0,
        comment: item.comment || "",
        uncertainty: item.uncertainty || "medium",
        sort_order: index,
      }));
    }

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
          await svcClient.from("ai_usage_logs").insert({ user_id: userData.user.id, function_name: "apply-estimate-voice-edits", model: "openai/gpt-5-mini", tokens_in: data.usage?.prompt_tokens, tokens_out: data.usage?.completion_tokens, response_time_ms: _aiEndTime - _aiStartTime, output_size: content?.length || 0 });
        }
      }
    } catch (_) {}

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in apply-estimate-voice-edits:", error);
    await reportError("apply-estimate-voice-edits", error, { endpoint: "apply-estimate-voice-edits" });
    const message = error instanceof Error ? error.message : "Ett fel uppstod";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
