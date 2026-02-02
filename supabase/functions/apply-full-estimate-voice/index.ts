/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

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

    // Helper function to guess article from text
    const mapToArticle = (text: string): string => {
      const lower = (text || "").toLowerCase();
      if (lower.includes("mål") || lower.includes("paint")) return "Målning";
      if (lower.includes("städ")) return "Städ";
      if (lower.includes("golv") || lower.includes("riv") || lower.includes("bygg") || lower.includes("snicka")) return "Bygg";
      if (lower.includes("maskin") || lower.includes("gräv")) return "Maskin";
      if (lower.includes("material") || lower.includes("kakel") || lower.includes("klinker")) return "Material";
      if (lower.includes("transport") || lower.includes("framkör")) return "Framkörning";
      if (lower.includes("deponi") || lower.includes("tipp")) return "Deponi";
      if (lower.includes("trädgård")) return "Trädgårdsskötsel";
      if (lower.includes("el") || lower.includes("vvs") || lower.includes("rörmok")) return "Arbete";
      return "Arbete";
    };

    const systemPrompt = `Du heter Saga och är en expert på offerter och kalkyler för byggprojekt i Sverige. Du hjälper användare att fylla i och uppdatera offerter baserat på röstkommandon på svenska.

OFFERTENS STRUKTUR:
- introductionText: Inledande text till kunden
- scope: Projektbeskrivning/omfattning
- assumptions: Tidsplan - planerade arbetsmoment och tidsramar (t.ex. "Vecka 1: Rivning", "2 veckor totalt")
- items: Offertposter med detaljerad information

TIDSPLAN (assumptions):
- När användaren nämner "tidsplan", "tidplan", "veckor", "dagar", "arbetsmoment i ordning", så ska detta gå till assumptions-arrayen
- Exempel: "Tidsplan två veckor" → assumptions: ["Totalt 2 veckor"]
- Exempel: "Vecka ett rivning, vecka två bygge" → assumptions: ["Vecka 1: Rivning", "Vecka 2: Bygge"]
- Varje punkt i tidsplanen ska vara ett separat element i arrayen
- Tidsplan-information ska ALDRIG hamna i scope, scope är bara projektbeskrivning
- addons: Tillval med namn och pris
- rotEnabled: Om ROT-avdrag är aktiverat (true/false)
- rotPercent: ROT-procent (vanligtvis 30 eller 50)
- closingText: Avslutande text/villkor
- markupPercent: Pålägg i procent (0-100)

OFFERTPOSTER (items) - OBLIGATORISKA FÄLT:

**KRITISKT VIKTIGT - article och description:**
- article: **OBLIGATORISKT** - Välj ALLTID ett värde från denna lista: "Arbete", "Bygg", "Deponi", "Framkörning", "Förbrukning", "Förvaltning", "Markarbete", "Maskin", "Material", "Målning", "Snöröjning", "Städ", "Trädgårdsskötsel"
- description: **OBLIGATORISKT** - Detaljerad beskrivning av arbetet. När användaren säger "beskrivning" eller "beskrivningen ska vara", sätt detta fält!
- moment: Sätt ALLTID samma värde som description (för bakåtkompatibilitet)

TOLKNING AV RÖSTKOMMANDON FÖR ARTIKEL OCH BESKRIVNING:
- "artikeln ska vara X" eller "artikel X" → article: matcha X till närmaste i listan ovan
- "beskrivningen ska vara X" eller "beskrivning X" → description: "X" OCH moment: "X"
- "artikel bygg, beskrivning lägga golv" → article: "Bygg", description: "lägga golv", moment: "lägga golv"

EXEMPEL PÅ KOMPLETTA OFFERTPOSTER:

Kommando: "Lägg till artikel bygg, beskrivning bygga golv, timmar, 750 kronor"
→ Resultat:
{
  "article": "Bygg",
  "description": "bygga golv",
  "moment": "bygga golv",
  "type": "labor",
  "unit": "tim",
  "unit_price": 750
}

Kommando: "Artikel ska vara målning, beskrivning måla väggar"
→ Resultat:
{
  "article": "Målning",
  "description": "måla väggar",
  "moment": "måla väggar"
}

ÖVRIGA FÄLT I OFFERTPOSTER:
- id: Unikt UUID
- show_only_total: true om endast summan ska visas (döljer mängd/pris för kund)
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

1. Lägg till poster med artikel och beskrivning:
- "Lägg till artikel bygg, beskrivning bygga golv, 8 timmar, 550 kronor" → article: "Bygg", description: "bygga golv"
- "Artikel målning, beskrivning måla tak" → article: "Målning", description: "måla tak"

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
6. **OBLIGATORISKT: Varje offertpost MÅSTE ha "article" och "description" satta!**
7. **När användaren säger "beskrivning", sätt BÅDE description OCH moment till samma värde**
8. **När användaren säger "artikel", matcha till närmaste värde i artikel-listan**
9. Om användaren nämner "underentreprenör" eller "UE", sätt type: "subcontractor"

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

Tidsplan:
${currentData.assumptions.length > 0 ? currentData.assumptions.map((a) => `- ${a}`).join('\n') : '(ingen tidsplan)'}

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

        // Ensure description and moment are synced, prioritize description
        const description = item.description || item.moment || "";
        const moment = item.moment || item.description || "";
        
        // Use mapToArticle if article is missing but we have description
        const article = item.article || (description ? mapToArticle(description) : "Arbete");

        return {
          id: item.id || crypto.randomUUID(),
          article,
          description,
          show_only_total: item.show_only_total || false,
          moment,
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
    await reportError("apply-full-estimate-voice", error, { endpoint: "apply-full-estimate-voice" });
    const message = error instanceof Error ? error.message : "Ett fel uppstod";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
