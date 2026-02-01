// Generate Estimate Edge Function with Template Support

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  moment: string;
  type: "labor" | "material" | "subcontractor";
  quantity: number | null;
  unit: string;
  hours: number | null;
  unit_price: number;
  subtotal: number;
  comment: string;
  uncertainty: "low" | "medium" | "high";
}

interface GeneratedEstimate {
  scope: string;
  assumptions: string[];
  uncertainties: string[];
  items: EstimateItem[];
  needs_more_info?: boolean;
  missing?: string[];
  example?: string;
}

interface WorkItem {
  wbs: string;
  name: string;
  unit: string;
  resource: string;
  hours_per_unit: number;
}

interface CostLibraryItem {
  id: string;
  name: string;
  unit: string;
  price: number;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  hourly_rates: Record<string, number>;
  work_items: WorkItem[];
  cost_library: CostLibraryItem[];
  material_spill_percent?: number;
  overhead_percent?: number;
  risk_percent?: number;
  profit_percent?: number;
  vat_percent?: number;
  establishment_cost?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, project_name, template } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return new Response(
        JSON.stringify({ error: "Transkription saknas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating estimate for:", project_name);
    console.log("Transcript:", transcript);
    console.log("Template:", template?.name);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build template-aware prompt
    let systemPrompt: string;
    
    if (template) {
      // Template-based estimation
      const hourlyRatesStr = Object.entries(template.hourly_rates || {})
        .map(([resource, rate]) => `- ${resource}: ${rate} kr/tim`)
        .join("\n");
      
      const workItemsStr = (template.work_items || [])
        .map((item: WorkItem) => `- ${item.wbs} ${item.name} (${item.unit}, ${item.resource}, ${item.hours_per_unit} h/enhet)`)
        .join("\n");
      
      const materialsStr = (template.cost_library || [])
        .map((item: CostLibraryItem) => `- ${item.name}: ${item.price} kr/${item.unit}`)
        .join("\n");

      systemPrompt = `Du är en expert på offerter för byggprojekt. Du ska skapa en offert baserad på en MALL och användarens mängdbeskrivning.

MALL: ${template.name}
${template.description || ""}

TIMPRISER (från mallen):
${hourlyRatesStr || "Inga timpriser definierade"}

ARBETSMOMENT (WBS från mallen):
${workItemsStr || "Inga moment definierade"}

MATERIALKOSTNADER (från mallen):
${materialsStr || "Inga material definierade"}

PÅSLAG OCH MOMS:
- Materialspill: ${template.material_spill_percent ?? 7}%
- Omkostnader: ${template.overhead_percent ?? 12}%
- Risk: ${template.risk_percent ?? 8}%
- Vinst: ${template.profit_percent ?? 10}%
- Moms: ${template.vat_percent ?? 25}%
- Etablering: ${template.establishment_cost ?? 4500} kr

INSTRUKTIONER:
1. Tolka användarens beskrivning för att få fram MÄNGDER (m², st, lpm, etc.)
2. Matcha mängderna mot mallens arbetsmoment
3. Beräkna timmar baserat på mallens "hours_per_unit"
4. Använd mallens timpriser och materialpriser
5. Skapa en komplett kalkyl

Om beskrivningen saknar tillräcklig information för att bestämma mängder, returnera:
{
  "needs_more_info": true,
  "missing": ["Lista på vad som saknas"],
  "example": "Exempel på vad användaren borde säga"
}

Annars returnera JSON:
{
  "scope": "Sammanfattning av projektet",
  "assumptions": ["Antaganden baserade på mallen"],
  "uncertainties": ["Osäkerheter att beakta"],
  "items": [
    {
      "moment": "Momentnamn från mallen",
      "type": "labor|material|subcontractor",
      "quantity": antal (för material),
      "unit": "m2|st|lpm|tim|klump",
      "hours": timmar (för arbete),
      "unit_price": pris från mallen,
      "subtotal": beräknad kostnad,
      "comment": "Förklaring",
      "uncertainty": "low|medium|high"
    }
  ]
}

VIKTIGT: Använd ALLTID mallens priser, gissa aldrig egna priser.
Svara ENDAST med JSON, ingen annan text.`;

    } else {
      // Fallback without template (legacy behavior)
      systemPrompt = `Du är en expert på att skapa projektkalkyler för byggbranschen i Sverige. Din uppgift är att:
1. Analysera användarens beskrivning
2. Identifiera alla arbetsmoment, material och underentreprenörer
3. Skapa en strukturerad kalkyl

STANDARDPRISER (fallback):
- Snickare: 520 kr/tim
- Målare: 480 kr/tim  
- Plattsättare: 520 kr/tim
- Allmänt arbete: 500 kr/tim

INSTRUKTIONER:
- Uppskatta antal TIMMAR baserat på projektets omfattning
- För material: Ange mängd och enhet, men sätt unit_price till 0 (användaren fyller i själv)
- För underentreprenörer (el, VVS): Sätt unit_price till 0 (användaren fyller i offertpris)

Om beskrivningen är för vag:
{
  "needs_more_info": true,
  "missing": ["Vilken typ av projekt", "Ungefärlig storlek/omfattning", "Vilka moment ingår"],
  "example": "Beskriv t.ex. 'Badrumsrenovering ca 8kvm, rivning av befintligt, nytt tätskikt, kakel och klinker, VVS-arbeten'"
}

Om beskrivningen är tillräcklig:
{
  "scope": "Kort sammanfattning av projektets omfattning",
  "assumptions": ["Antagande 1", "Antagande 2"],
  "uncertainties": ["Osäkerhet 1", "Osäkerhet 2"],
  "items": [
    {
      "moment": "Namn på moment",
      "type": "labor|material|subcontractor",
      "quantity": null eller antal,
      "unit": "tim|m2|st|lpm|klump",
      "hours": antal timmar,
      "unit_price": á-pris i SEK,
      "subtotal": beräknad delkostnad,
      "comment": "Förklaring",
      "uncertainty": "low|medium|high"
    }
  ]
}

Svara ENDAST med JSON, ingen annan text.`;
    }

    const userPrompt = project_name 
      ? `Projekt: ${project_name}\n\nBeskrivning/mängder: ${transcript}`
      : transcript;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Tomt svar från AI");
    }

    console.log("AI response:", content);

    // Parse the JSON response
    let estimate: GeneratedEstimate;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, content];
      const jsonStr = jsonMatch[1] || content;
      estimate = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      throw new Error("Kunde inte tolka AI-svaret. Försök igen.");
    }

    // Check if AI needs more info - return early
    if (estimate.needs_more_info) {
      console.log("AI needs more info, returning needs_more_info response");
      return new Response(
        JSON.stringify({
          needs_more_info: true,
          missing: estimate.missing || [],
          example: estimate.example || "Beskriv projektets omfattning mer detaljerat.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and calculate totals
    let laborCost = 0;
    let materialCost = 0;
    let subcontractorCost = 0;

    estimate.items = estimate.items.map((item: EstimateItem, index: number) => {
      // Ensure subtotal is calculated
      let subtotal = item.subtotal;
      if (!subtotal && item.unit_price) {
        if (item.hours) {
          subtotal = item.hours * item.unit_price;
        } else if (item.quantity) {
          subtotal = item.quantity * item.unit_price;
        } else {
          subtotal = item.unit_price;
        }
      }

      // Track costs by type
      switch (item.type) {
        case "labor":
          laborCost += subtotal || 0;
          break;
        case "material":
          materialCost += subtotal || 0;
          break;
        case "subcontractor":
          subcontractorCost += subtotal || 0;
          break;
      }

      return {
        ...item,
        subtotal: subtotal || 0,
        uncertainty: item.uncertainty || "medium",
      };
    });

    return new Response(
      JSON.stringify({
        ...estimate,
        labor_cost: laborCost,
        material_cost: materialCost,
        subcontractor_cost: subcontractorCost,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating estimate:", error);
    await reportError("generate-estimate", error, { endpoint: "generate-estimate" });
    return new Response(
      JSON.stringify({ error: error.message || "Ett fel uppstod" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
