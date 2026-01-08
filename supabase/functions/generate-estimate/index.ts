// Generate Estimate Edge Function

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, project_name, user_pricing } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return new Response(
        JSON.stringify({ error: "Transkription saknas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating estimate for:", project_name);
    console.log("Transcript:", transcript);

    // Default pricing if user hasn't set up their own
    const pricing = {
      hourly_rate_carpenter: user_pricing?.hourly_rate_carpenter ?? 520,
      hourly_rate_painter: user_pricing?.hourly_rate_painter ?? 480,
      hourly_rate_tiler: user_pricing?.hourly_rate_tiler ?? 520,
      hourly_rate_general: user_pricing?.hourly_rate_general ?? 500,
      material_markup_percent: user_pricing?.material_markup_percent ?? 10,
    };

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Du är en expert på att skapa projektkalkyler för byggbranschen i Sverige. Din uppgift är att:
1. Analysera användarens beskrivning
2. Identifiera alla arbetsmoment, material och underentreprenörer
3. Skapa en strukturerad kalkyl med ANVÄNDARENS egna priser

VIKTIGT - ANVÄND DESSA PRISER (användarens inställningar):
- Snickare: ${pricing.hourly_rate_carpenter} kr/tim
- Målare: ${pricing.hourly_rate_painter} kr/tim  
- Plattsättare: ${pricing.hourly_rate_tiler} kr/tim
- Allmänt arbete: ${pricing.hourly_rate_general} kr/tim

INSTRUKTIONER:
- ANVÄND alltid ovanstående timpriser för arbete (gissa INTE egna priser)
- För material: Ange mängd och enhet, men sätt unit_price till 0 (användaren fyller i själv)
- För underentreprenörer (el, VVS): Sätt unit_price till 0 (användaren fyller i offertpris)
- Uppskatta antal TIMMAR baserat på projektets omfattning
- Markera tydligt i comment vad som är uppskattat

VIKTIGT - Innan du skapar kalkylen:
- Om beskrivningen är för vag för att göra en meningsfull kalkyl, returnera ett needs_more_info objekt
- Exempel på för vaga beskrivningar: "renovering", "bygge", "lite jobb"

Du ska returnera JSON i detta format:

Om beskrivningen är för vag:
{
  "needs_more_info": true,
  "missing": ["Vilken typ av projekt", "Ungefärlig storlek/omfattning", "Vilka moment ingår"],
  "example": "Beskriv t.ex. 'Badrumsrenovering ca 8kvm, rivning av befintligt, nytt tätskikt, kakel och klinker, VVS-arbeten'"
}

Om beskrivningen är tillräcklig:
{
  "scope": "Kort sammanfattning av projektets omfattning",
  "assumptions": [
    "Antagande 1 - t.ex. standardmaterial om inget annat anges",
    "Antagande 2 - t.ex. normal åtkomst"
  ],
  "uncertainties": [
    "Osäkerhet 1 - t.ex. dolda problem kan tillkomma",
    "Osäkerhet 2 - t.ex. prisläge kan variera"
  ],
  "items": [
    {
      "moment": "Namn på moment",
      "type": "labor|material|subcontractor",
      "quantity": null eller antal (för material),
      "unit": "tim|m2|st|lpm|klump",
      "hours": antal timmar (för arbete),
      "unit_price": á-pris i SEK (0 för material/UE som användaren fyller i),
      "subtotal": beräknad delkostnad (0 om unit_price är 0),
      "comment": "Förklaring - t.ex. 'Ditt timpris' eller 'Fyll i materialpris'",
      "uncertainty": "low|medium|high"
    }
  ]
}

TIMUPPSKATTNINGAR (referens för 8 kvm badrum):
- Rivning: 12-20 tim
- Tätskikt: 6-10 tim
- Kakelsättning väggar: 16-24 tim
- Klinker golv: 6-10 tim
- Snickeriarbete: 8-16 tim

OSÄKERHETSNIVÅER:
- low: Väl definierat, ditt timpris används
- medium: Normalt projekt, timmar uppskattat
- high: Kräver offert eller platsbedömning

Svara ENDAST med JSON, ingen annan text.`;

    const userPrompt = project_name 
      ? `Projekt: ${project_name}\n\nBeskrivning: ${transcript}`
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
    return new Response(
      JSON.stringify({ error: error.message || "Ett fel uppstod" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
