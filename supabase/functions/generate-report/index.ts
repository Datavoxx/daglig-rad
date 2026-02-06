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

const systemPrompt = `Du heter Ulla och är en erfaren platschef-assistent för svenska byggarbetsplatser. Du omvandlar rösttranskriberingar till en strukturerad dagrapport (bygg).
Du får EN input: ett transkript (svenska) + metadata (datum, projekt-id, användare).
Du ska returnera ENDAST giltig JSON enligt schema nedan, inga extra ord.

Viktigt:
- Inga följdfrågor i v1.
- Om information saknas: sätt null eller tom lista.
- Var konservativ: gissa inte exakta siffror om de inte uttrycks.
- Normalisera tider till decimal-timmar om möjligt (t.ex. "7 timmar" = 7.0).
- Räkna totala timmar om antal_personer och timmar_per_person finns.
- Extrahera "arbete" som en lista med korta punkter (max 120 tecken per punkt).
- Extrahera "avvikelser" som objekt med typ + beskrivning + timmar (om uttryckt).
- Behåll originaltexten oförändrad i original_transkript.

ÄTA (Ändrings- och Tilläggsarbeten):
- Identifiera ÄTA om användaren nämner arbete som INTE kunde utföras på grund av yttre omständigheter OCH detta leder till tillkommande arbete.
- Typiska formuleringar: "på grund av X måste vi göra Y", "kunde inte utföra arbetet pga...", "detta kommer leda till extra arbete".
- ÄTA är INTE samma som avvikelser - avvikelser är problem/förseningar, ÄTA är dokumentation av kontraktsändringar/tilläggsarbete.
- Sätt has_ata till true endast om det finns tydliga indikationer på ändrings- eller tilläggsarbeten.

JSON-schema:
{
  "report_date": "YYYY-MM-DD",
  "project_id": "string",
  "reporter_user_id": "string",
  "crew": {
    "headcount": number|null,
    "roles": [string],
    "hours_per_person": number|null,
    "total_hours": number|null
  },
  "work_items": [string],
  "deviations": [
    {
      "type": "waiting_time|material_delay|weather|coordination|equipment|safety|quality|other",
      "description": "string",
      "hours": number|null
    }
  ],
  "ata": {
    "has_ata": boolean,
    "items": [
      {
        "reason": "Anledning/orsak till ändringen",
        "consequence": "Vad detta leder till/tillkommande arbete",
        "estimated_hours": number|null
      }
    ]
  },
  "extra_work": [string],
  "materials": {
    "delivered": [string],
    "missing": [string]
  },
  "notes": "string|null",
  "original_transcript": "string",
  "confidence": {
    "overall": number,
    "low_confidence_fields": [string]
  }
}

Sätt confidence.overall mellan 0.0 och 1.0.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, project_id, report_date, user_id } = await req.json();

    if (!transcript || !project_id || !report_date) {
      return new Response(
        JSON.stringify({ error: "Saknar nödvändiga fält: transcript, project_id, report_date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI-tjänsten är inte konfigurerad" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Metadata:
- report_date: ${report_date}
- project_id: ${project_id}
- reporter_user_id: ${user_id || 'anonymous'}

Transcript (svenska):
"""${transcript}"""`;

    console.log("Calling AI gateway with transcript length:", transcript.length);

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "För många förfrågningar. Försök igen om en stund." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-krediter slut. Vänligen ladda på ditt konto." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Kunde inte generera rapport. Försök igen." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response:", data);
      return new Response(
        JSON.stringify({ error: "Inget svar från AI. Försök igen." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent.slice(7);
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.slice(3);
    }
    if (jsonContent.endsWith("```")) {
      jsonContent = jsonContent.slice(0, -3);
    }
    jsonContent = jsonContent.trim();

    try {
      const parsedReport = JSON.parse(jsonContent);
      console.log("Successfully parsed report with confidence:", parsedReport.confidence?.overall);
      
      return new Response(JSON.stringify(parsedReport), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError, "Content:", jsonContent.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Kunde inte tolka AI-svaret. Försök igen." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in generate-report:", error);
    await reportError("generate-report", error, { endpoint: "generate-report" });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Okänt fel" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
