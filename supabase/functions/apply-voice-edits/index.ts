import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      systemPrompt = `Du är en assistent som uppdaterar dagrapporter baserat på svenska röstinstruktioner.

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
      systemPrompt = `Du är en assistent som uppdaterar projektplaneringar baserat på svenska röstinstruktioner.

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
      systemPrompt = `Du är en assistent som uppdaterar egenkontroller baserat på svenska röstinstruktioner.

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
    return new Response(
      JSON.stringify({ error: error.message || "Kunde inte applicera ändringarna" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
