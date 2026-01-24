/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EstimateItem {
  id: string;
  article?: string;
  description?: string;
  show_only_total?: boolean;
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
  rot_eligible?: boolean;
}

interface EstimateAddon {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_selected: boolean;
  sort_order: number;
}

interface CurrentData {
  introductionText: string;
  scope: string;
  assumptions: string[];
  items: EstimateItem[];
  addons: EstimateAddon[];
  rotEnabled: boolean;
  rotPercent: number;
  closingText: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, currentData } = await req.json() as {
      transcript: string;
      currentData: CurrentData;
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

    const systemPrompt = `Du är en assistent som hjälper till att fylla i och uppdatera offerter baserat på röstkommandon på svenska.

DU FÅR:
1. En transkription av ett röstkommando (på svenska)
2. Nuvarande offertdata

OFFERTENS STRUKTUR:
- introductionText: Inledande text till kunden (hälsningsfras, presentation)
- scope: Projektbeskrivning/omfattning av arbetet
- assumptions: Lista med "Arbete som ingår" - varje element är en beskrivning
- items: Offertposter med detaljerad information
- addons: Tillval med namn och pris
- rotEnabled: Om ROT-avdrag är aktiverat (true/false)
- rotPercent: ROT-procent (vanligtvis 30 eller 50)
- closingText: Avslutande text/villkor

OFFERTPOSTER (items) - VIKTIGT:
Varje post har följande fält:
- id: Unikt UUID
- moment: Beskrivning av arbetet (t.ex. "Rivning av badrumsinredning")
- type: "labor" (arbete), "material" (material), eller "subcontractor" (underentreprenör)
- quantity: Antal/mängd (null för arbete som mäts i timmar)
- unit: Enhet - "tim" (timmar), "m²" (kvadratmeter), "st" (styck), "lpm" (löpmeter), "klump" (fast pris)
- hours: Antal timmar (endast för type="labor", annars null)
- unit_price: Á-pris per enhet
- subtotal: Beräknad delsumma
- uncertainty: "low", "medium", eller "high"
- rot_eligible: true om posten är ROT-berättigad (endast för arbete)

BERÄKNING AV SUBTOTAL:
- labor (arbete): subtotal = hours × unit_price
- material: subtotal = quantity × unit_price
- subcontractor: subtotal = quantity × unit_price
- Om unit är "klump": subtotal = unit_price (fast pris)

TILLVAL (addons):
- id: Unikt UUID
- name: Namn på tillvalet
- description: Beskrivning (valfritt)
- price: Pris i kronor
- is_selected: true/false (sätt till true för nya tillval)
- sort_order: Ordning

EXEMPEL PÅ RÖSTKOMMANDON OCH TOLKNING:

1. Offertposter:
- "Lägg till rivning 16 timmar 650 kronor per timme" → ny labor-post
- "Lägg till kakel 25 kvadrat 450 kronor" → ny material-post med unit="m²"
- "Ändra rivning till 20 timmar" → uppdatera befintlig post
- "Ta bort golvläggning" → ta bort matchande post
- "Lägg till underentreprenör för el, klumpsumma 15000" → ny subcontractor med unit="klump"

2. Tillval:
- "Lägg till tillval för extra städning 2500 kronor" → nytt addon
- "Tillval: projektledning 5000 kronor" → nytt addon

3. ROT-avdrag:
- "Aktivera ROT" eller "Slå på ROT-avdrag" → rotEnabled = true
- "Stäng av ROT" → rotEnabled = false
- "Sätt ROT till 50 procent" → rotPercent = 50

4. Texter:
- "Inledningen ska vara: Tack för att ni..." → uppdatera introductionText
- "Projektbeskrivning: Totalrenovering av badrum" → uppdatera scope
- "Arbete som ingår: rivning, montering, målning" → uppdatera assumptions
- "Avslut: Offerten gäller i 30 dagar" → uppdatera closingText

VIKTIGA REGLER:
1. Behåll ALL data som inte explicit ändras
2. Generera UUID med crypto.randomUUID() format för nya poster
3. Beräkna subtotal korrekt baserat på typ och enhet
4. Tolka svenska enheter: "timmar"="tim", "kvadrat"/"kvm"="m²", "styck"="st", "löpmeter"="lpm"
5. Nya tillval ska ha is_selected: true
6. Sätt rot_eligible: true för arbetsmoment som kan vara ROT-berättigade

RETURNERA ENDAST giltig JSON med denna exakta struktur:
{
  "introductionText": "...",
  "scope": "...",
  "assumptions": ["..."],
  "items": [...],
  "addons": [...],
  "rotEnabled": true/false,
  "rotPercent": 30,
  "closingText": "...",
  "changes_made": "Kort beskrivning av vad du ändrade"
}`;

    // Create a summary of current data for the AI
    const itemsSummary = currentData.items.map((item, i) => 
      `${i + 1}. ${item.moment} (${item.type}): ${item.quantity ?? '-'} ${item.unit}, ${item.hours ?? '-'} tim, ${item.unit_price} kr, summa ${item.subtotal} kr`
    ).join('\n');

    const addonsSummary = currentData.addons.map((addon, i) =>
      `${i + 1}. ${addon.name}: ${addon.price} kr ${addon.is_selected ? '(vald)' : '(ej vald)'}`
    ).join('\n');

    const userPrompt = `Röstkommando: "${transcript}"

NUVARANDE OFFERTDATA:

Inledning: "${currentData.introductionText || '(tom)'}"

Projektbeskrivning: "${currentData.scope || '(tom)'}"

Arbete som ingår:
${currentData.assumptions.length > 0 ? currentData.assumptions.map((a, i) => `- ${a}`).join('\n') : '(inga)'}

Offertposter:
${itemsSummary || '(inga)'}

Tillval:
${addonsSummary || '(inga)'}

ROT-avdrag: ${currentData.rotEnabled ? `Aktiverat (${currentData.rotPercent}%)` : 'Ej aktiverat'}

Avslutande text: "${currentData.closingText || '(tom)'}"

Tolka röstkommandot och returnera uppdaterad offertdata. Behåll all data som inte ändras.`;

    console.log("Processing voice command:", transcript);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 8000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "För många förfrågningar, vänta en stund och försök igen" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Krediter slut, kontakta administratör" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("AI response:", content);

    // Parse JSON from response, handling potential markdown code blocks
    let jsonStr = content;
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    } else {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }

    const result = JSON.parse(jsonStr);

    // Ensure all items have required fields and correct calculations
    if (result.items) {
      result.items = result.items.map((item: any, index: number) => {
        const type = item.type || "labor";
        const unit = item.unit || "tim";
        const hours = item.hours ?? null;
        const quantity = item.quantity ?? null;
        const unitPrice = Number(item.unit_price) || 0;
        
        // Calculate subtotal
        let subtotal = Number(item.subtotal) || 0;
        if (unit === "klump") {
          subtotal = unitPrice;
        } else if (type === "labor" && hours !== null) {
          subtotal = hours * unitPrice;
        } else if (quantity !== null) {
          subtotal = quantity * unitPrice;
        }

        return {
          id: item.id || crypto.randomUUID(),
          article: item.article || "",
          description: item.description || "",
          show_only_total: item.show_only_total || false,
          moment: item.moment || "",
          type,
          quantity,
          unit,
          hours,
          unit_price: unitPrice,
          subtotal,
          comment: item.comment || "",
          uncertainty: item.uncertainty || "medium",
          sort_order: index,
          rot_eligible: item.rot_eligible ?? (type === "labor"),
        };
      });
    }

    // Ensure all addons have required fields
    if (result.addons) {
      result.addons = result.addons.map((addon: any, index: number) => ({
        id: addon.id || crypto.randomUUID(),
        name: addon.name || "",
        description: addon.description || "",
        price: Number(addon.price) || 0,
        is_selected: addon.is_selected ?? true,
        sort_order: index,
      }));
    }

    // Ensure other fields have defaults
    result.introductionText = result.introductionText ?? currentData.introductionText;
    result.scope = result.scope ?? currentData.scope;
    result.assumptions = result.assumptions ?? currentData.assumptions;
    result.items = result.items ?? currentData.items;
    result.addons = result.addons ?? currentData.addons;
    result.rotEnabled = result.rotEnabled ?? currentData.rotEnabled;
    result.rotPercent = result.rotPercent ?? currentData.rotPercent;
    result.closingText = result.closingText ?? currentData.closingText;

    console.log("Processed result:", result.changes_made);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in apply-full-estimate-voice:", error);
    const message = error instanceof Error ? error.message : "Ett fel uppstod";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
