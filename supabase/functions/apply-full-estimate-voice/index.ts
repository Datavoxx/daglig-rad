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
  markupPercent: number;
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

OFFERTENS STRUKTUR:
- introductionText: Inledande text till kunden
- scope: Projektbeskrivning/omfattning
- assumptions: Lista med "Arbete som ingår"
- items: Offertposter med detaljerad information
- addons: Tillval med namn och pris
- rotEnabled: Om ROT-avdrag är aktiverat (true/false)
- rotPercent: ROT-procent (vanligtvis 30 eller 50)
- closingText: Avslutande text/villkor
- markupPercent: Pålägg i procent (0-100)

OFFERTPOSTER (items) - FULLSTÄNDIG STRUKTUR:
Varje post har följande fält:
- id: Unikt UUID
- article: Artikelkategori - VÄLJ FRÅN: "Arbete", "Bygg", "Deponi", "Framkörning", "Förbrukning", "Förvaltning", "Markarbete", "Maskin", "Material", "Målning", "Snöröjning", "Städ", "Trädgårdsskötsel"
- description: Detaljerad beskrivning av arbetet
- show_only_total: true om endast summan ska visas (döljer mängd/pris för kund)
- moment: Kort rubrik/moment
- type: "labor" (arbete), "material", eller "subcontractor" (underentreprenör/UE)
- quantity: Antal/mängd (null för arbete som mäts i timmar)
- unit: Enhet - "tim", "m²", "st", "lpm", "klump"
- hours: Antal timmar (endast för type="labor")
- unit_price: Á-pris per enhet
- subtotal: Beräknad delsumma
- comment: Intern kommentar (visas ej för kund)
- uncertainty: "low" (låg), "medium" (medel), eller "high" (hög osäkerhet)
- rot_eligible: true om posten är ROT-berättigad

MAPPNING AV ARTIKEL (automatisk baserat på kontext):
- Målning/måla → article: "Målning"
- Rivning/bygg/snickeri/golv → article: "Bygg"
- Städning/slutstädning → article: "Städ"
- Maskin/maskiner/grävmaskin → article: "Maskin"
- El/elektriker/rörmokare → article: "Arbete" (type: "subcontractor")
- Kakel/klinker/parkett → article: "Material" (type: "material")
- Transport/framkörning → article: "Framkörning"
- Deponi/tipp → article: "Deponi"
- Trädgård → article: "Trädgårdsskötsel"

EXEMPEL PÅ RÖSTKOMMANDON:

1. Lägg till poster med artikel-kategori:
- "Lägg till målning av väggar, 8 timmar, 550 kronor" → article: "Målning", type: "labor"
- "Lägg till kakel som material, 25 kvadrat, 450 per kvadrat" → article: "Material", type: "material"
- "Lägg till elektriker som underentreprenör, klumpsumma 15000" → article: "Arbete", type: "subcontractor"

2. Visa endast total (döljer detaljer för kund):
- "Visa bara summan på rivning" → show_only_total: true för den posten
- "Dölj detaljerna på golvläggning" → show_only_total: true
- "Visa detaljerna på målning" → show_only_total: false

3. Osäkerhetsnivå:
- "Sätt hög osäkerhet på målning" → uncertainty: "high"
- "Låg osäkerhet på rivning" → uncertainty: "low"
- "Medel osäkerhet på alla poster" → alla items får uncertainty: "medium"

4. Kommentarer (intern, visas ej för kund):
- "Lägg till kommentar på rivning: kolla asbest först" → comment: "kolla asbest först"
- "Kommentera kakelposten med leverans osäker" → comment: "leverans osäker"

5. ROT-berättigad per post:
- "Den här posten ska vara ROT-berättigad" → rot_eligible: true
- "Rivning ska inte ha ROT" → rot_eligible: false
- "Alla arbetsposter ska ha ROT" → rot_eligible: true på alla type: "labor"

6. Tillval - välja/avmarkera/ta bort:
- "Välj tillvalet extra städning" → is_selected: true på matchande tillval
- "Avmarkera tillvalet för projektledning" → is_selected: false
- "Ta bort tillvalet extra städning" → ta bort från addons-arrayen

7. Påläggsprocent:
- "Sätt pålägg till 15 procent" → markupPercent: 15
- "Öka pålägget till 20 procent" → markupPercent: 20
- "Inget pålägg" eller "Noll procent pålägg" → markupPercent: 0

8. ROT-avdrag globalt:
- "Aktivera ROT" → rotEnabled: true
- "Stäng av ROT" → rotEnabled: false
- "Sätt ROT till 50 procent" → rotPercent: 50

BERÄKNING AV SUBTOTAL:
- labor: subtotal = hours × unit_price
- material/subcontractor med quantity: subtotal = quantity × unit_price
- klump (unit="klump"): subtotal = unit_price

ENHETSÖVERSÄTTNING:
- "timmar"/"timme" → "tim"
- "kvadrat"/"kvadratmeter"/"kvm" → "m²"
- "styck"/"stycken" → "st"
- "löpmeter" → "lpm"
- "klumpsumma"/"fast pris" → "klump"

VIKTIGA REGLER:
1. Behåll ALLTID all data som inte explicit ändras av röstkommandot
2. Generera UUID för nya poster (format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
3. Beräkna subtotal korrekt enligt formlerna ovan
4. Nya offertposter: rot_eligible = true om type är "labor", annars false
5. Nya tillval: is_selected = true som standard
6. Mappa article automatiskt baserat på postens karaktär
7. Om användaren nämner "underentreprenör" eller "UE", sätt type: "subcontractor"

RETURNERA ALLTID giltig JSON med exakt denna struktur:
{
  "introductionText": "...",
  "scope": "...",
  "assumptions": [...],
  "items": [...],
  "addons": [...],
  "rotEnabled": true/false,
  "rotPercent": 30,
  "closingText": "...",
  "markupPercent": 0,
  "changes_made": "Kort beskrivning av ändringar på svenska"
}`;

    // Build summary of current items with full details
    const itemsSummary = currentData.items.map((item, i) => 
      `${i + 1}. [${item.article || 'Okänd'}] ${item.moment || item.description || '(ingen beskrivning)'} (${item.type}): ` +
      `${item.quantity ?? '-'} ${item.unit || ''}, ${item.hours ?? '-'} tim, ${item.unit_price || 0} kr/enhet, ` +
      `summa ${item.subtotal || 0} kr, osäkerhet: ${item.uncertainty || 'ej satt'}, ` +
      `ROT: ${item.rot_eligible ? 'ja' : 'nej'}, visa bara total: ${item.show_only_total ? 'ja' : 'nej'}` +
      (item.comment ? `, kommentar: "${item.comment}"` : '')
    ).join('\n');
    
    // Build summary of addons
    const addonsSummary = currentData.addons.map((addon, i) => 
      `${i + 1}. ${addon.name}: ${addon.price} kr (${addon.is_selected ? 'vald' : 'ej vald'})` +
      (addon.description ? ` - ${addon.description}` : '')
    ).join('\n');

    const userPrompt = `Röstkommando: "${transcript}"

NUVARANDE OFFERTDATA:

Inledning: "${currentData.introductionText || '(tom)'}"

Projektbeskrivning: "${currentData.scope || '(tom)'}"

Arbete som ingår:
${currentData.assumptions.length > 0 ? currentData.assumptions.map((a) => `- ${a}`).join('\n') : '(inga punkter)'}

Offertposter:
${itemsSummary || '(inga poster)'}

Tillval:
${addonsSummary || '(inga tillval)'}

ROT-avdrag: ${currentData.rotEnabled ? `Aktiverat (${currentData.rotPercent}%)` : 'Ej aktiverat'}

Pålägg: ${currentData.markupPercent ?? 0}%

Avslutande text: "${currentData.closingText || '(tom)'}"

Tolka röstkommandot och returnera uppdaterad offertdata som JSON. Behåll all data som inte ändras.`;

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
    result.markupPercent = result.markupPercent ?? currentData.markupPercent;

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
