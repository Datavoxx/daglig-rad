import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const { transcript, currentData, documentType } = await req.json();

    if (!transcript || !currentData || !documentType) {
      return new Response(
        JSON.stringify({ error: "Saknar transcript, currentData eller documentType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";

    if (documentType === "report") {
      systemPrompt = `Du heter Ulla och är en erfaren dokumentationsassistent för svenska byggarbetsplatser. Du uppdaterar dagrapporter baserat på röstinstruktioner.

NUVARANDE RAPPORT:
${JSON.stringify(currentData, null, 2)}

Användaren ger dig instruktioner om ändringar. Applicera ändringarna och returnera den FULLSTÄNDIGA uppdaterade rapporten.

FÖRSTÅ DESSA INSTRUKTIONER:
- "Ändra antal personer till X" → uppdatera crew.headcount
- "Lägg till väntetid på X timmar" → lägg till i deviations med type "waiting_time"
- "Ta bort [moment/avvikelse]" → ta bort från listan
- "Ändra timmar till X" → uppdatera crew.hours_per_person
- "Lägg till arbetsmomentet [text]" → lägg till i work_items
- "Lägg till ÄTA för [anledning]" → lägg till i ata.items

Svara ENDAST med det uppdaterade JSON-objektet. Behåll all befintlig data som inte ändras.`;
    } else if (documentType === "planning") {
      systemPrompt = `Du heter Bo och är en expert på byggprojektplanering. Du uppdaterar projektplaneringar baserat på röstinstruktioner.

NUVARANDE PLANERING:
${JSON.stringify(currentData, null, 2)}

Användaren ger dig instruktioner om ändringar. Applicera ändringarna och returnera den FULLSTÄNDIGA uppdaterade planeringen.

FÖRSTÅ DESSA INSTRUKTIONER:
- "Förläng [fas] med X veckor" → öka duration_weeks
- "Korta ner [fas] till X veckor" → minska duration_weeks
- "Lägg till fas [namn] efter [annan fas]" → skapa ny fas med lämplig start_week
- "Ta bort fas [namn]" → ta bort fasen
- "Flytta [fas] till vecka X" → ändra start_week
- "Byt namn på [fas] till [nytt namn]" → uppdatera name

Svara ENDAST med det uppdaterade JSON-objektet. Behåll all befintlig data som inte ändras.`;
  } else if (documentType === "inspection") {
      systemPrompt = `Du heter Ulla och är en erfaren dokumentationsassistent för svenska byggarbetsplatser. Du uppdaterar egenkontroller baserat på röstinstruktioner.

NUVARANDE EGENKONTROLL:
${JSON.stringify(currentData, null, 2)}

Användaren ger dig instruktioner om ändringar. Applicera ändringarna och returnera den FULLSTÄNDIGA uppdaterade kontrollen.

FÖRSTÅ DESSA INSTRUKTIONER:
- "Punkt X OK" eller "Punkt X godkänd" → sätt checkpoints[X-1].result = "ok"
- "Punkt X avvikelse" → sätt checkpoints[X-1].result = "deviation"
- "Punkt X avvikelse: [beskrivning]" → sätt result = "deviation" och comment = beskrivning
- "Punkt X ej tillämpligt" eller "Punkt X NA" → sätt result = "na"
- "Lägg till kommentar på punkt X: [text]" → uppdatera comment
- "Ändra kontrollant till [namn]" → uppdatera inspectorName
- "Lägg till anteckning: [text]" → uppdatera notes

Svara ENDAST med det uppdaterade JSON-objektet. Behåll all befintlig data som inte ändras.`;
    } else if (documentType === "template") {
      systemPrompt = `Du heter Saga och är en expert på offerter, kalkyler och kalkylmallar för byggprojekt. Du uppdaterar mallar baserat på röstinstruktioner.

NUVARANDE MALL:
${JSON.stringify(currentData, null, 2)}

Användaren ger dig instruktioner om ändringar. Applicera ändringarna och returnera den FULLSTÄNDIGA uppdaterade mallen.

FÖRSTÅ DESSA INSTRUKTIONER:
- "Ändra [resurs] till X kronor" → uppdatera hourly_rates[resurs] = X
- "Lägg till [resurs] X kronor i timmen" → lägg till i hourly_rates
- "Ta bort moment X" eller "Ta bort [namn]" → ta bort från work_items
- "Ändra [moment] till X timmar per enhet" → uppdatera hours_per_unit
- "Lägg till moment [namn] under [resurs]" → lägg till i work_items
- "Ändra materialpåslag till X procent" → uppdatera material_spill_percent
- "Ändra omkostnader till X procent" → uppdatera overhead_percent
- "Ändra risk till X procent" → uppdatera risk_percent
- "Ändra vinst till X procent" → uppdatera profit_percent
- "Ändra moms till X procent" → uppdatera vat_percent
- "Ändra etablering till X kronor" → uppdatera establishment_cost
- "Lägg till material [namn] X kronor" → lägg till i cost_library
- "Ta bort material [namn]" → ta bort från cost_library

Svara ENDAST med det uppdaterade JSON-objektet. Behåll all befintlig data som inte ändras.`;
    } else if (documentType === "work_order") {
      systemPrompt = `Du heter Ulla och är en erfaren dokumentationsassistent för svenska byggarbetsplatser. Du fyller i arbetsorder baserat på röstinstruktioner.

NUVARANDE ARBETSORDER:
${JSON.stringify(currentData, null, 2)}

Användaren beskriver en arbetsorder med röst. Extrahera relevant information och returnera ett JSON-objekt med följande fält:
- title: Kort titel för arbetet (obligatoriskt)
- description: Detaljerad beskrivning av arbetet
- assigned_to: Namn på personen som ska utföra arbetet (om nämnt)
- status: "pending", "in_progress", eller "completed" (default: "pending")

EXEMPEL PÅ RÖSTINPUT:
- "Installera nya fönster i fasaden mot söder, Erik ansvarar" → { "title": "Installera nya fönster", "description": "Installera nya fönster i fasaden mot söder", "assigned_to": "Erik", "status": "pending" }
- "Byta ut gammal panel i hallen" → { "title": "Byta ut panel", "description": "Byta ut gammal panel i hallen", "status": "pending" }

Svara ENDAST med JSON-objektet.`;
    } else if (documentType === "ata") {
      systemPrompt = `Du heter Ulla och är en erfaren dokumentationsassistent för ändrings- och tilläggsarbeten i byggprojekt. Du fyller i ÄTA baserat på röstinstruktioner.

NUVARANDE ÄTA:
${JSON.stringify(currentData, null, 2)}

Användaren beskriver ett ändringsarbete med röst. Extrahera relevant information och returnera ett JSON-objekt med följande fält:
- article: Kategori av arbete ("Arbete", "Bygg", "El", "VVS", "Material", "Målning", "Plattsättning", "Maskin", "Deponi", "Övrigt")
- description: Beskrivning av arbetet (obligatoriskt)
- reason: Anledning till ÄTA:n (varför behövs det)
- unit: Enhet för arbetet ("tim", "st", "m", "m²", "m³", "lpm", "kg", "klump")
- quantity: Antal (nummer)
- unit_price: Pris per enhet (nummer)
- rot_eligible: Om ROT-avdrag gäller (true/false)
- status: "pending", "approved", eller "rejected" (default: "pending")

EXEMPEL PÅ RÖSTINPUT:
- "Extra rivningsarbete på 4 timmar á 650 kronor för att åtgärda fuktskada" → { "article": "Arbete", "description": "Extra rivningsarbete för att åtgärda fuktskada", "reason": "Fuktskada upptäcktes vid rivning", "unit": "tim", "quantity": 4, "unit_price": 650, "status": "pending" }
- "Lägg till 10 kvadratmeter kakelsättning i badrum á 1200 kronor" → { "article": "Plattsättning", "description": "Kakelsättning i badrum", "unit": "m²", "quantity": 10, "unit_price": 1200, "status": "pending" }

Mappa artiklar baserat på typ av arbete:
- El-arbete, kabeldragning → "El"
- Rörmokeri, VVS-arbete → "VVS"
- Målning, tapetsering → "Målning"
- Kakel, klinker, plattor → "Plattsättning"
- Snickeri, timmerarbete → "Bygg"
- Rivning, städning, allmänt → "Arbete"

Svara ENDAST med JSON-objektet.`;
    } else {
      return new Response(
        JSON.stringify({ error: "Okänd dokumenttyp" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
          { role: "user", content: transcript },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "För många förfrågningar, försök igen om en stund" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Krediter slut, kontakta support" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI API error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Inget svar från AI");
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const updatedData = JSON.parse(jsonStr);

    return new Response(
      JSON.stringify(updatedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("apply-voice-edits error:", error);
    await reportError("apply-voice-edits", error, { endpoint: "apply-voice-edits" });
    return new Response(
      JSON.stringify({ error: error.message || "Kunde inte applicera ändringarna" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
