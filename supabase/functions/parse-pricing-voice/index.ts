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
    const { transcript } = await req.json();

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: "Ingen text att tolka" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Du är en assistent som tolkar svenska tal om prisuppgifter för byggprojekt.

Användaren säger priser för olika yrkeskategorier och påslag. Extrahera följande värden:

- hourly_rate_carpenter: Timpris för snickare (kr/tim)
- hourly_rate_painter: Timpris för målare (kr/tim)  
- hourly_rate_tiler: Timpris för plattsättare (kr/tim)
- hourly_rate_general: Timpris för allmänt arbete (kr/tim)
- material_markup_percent: Materialpåslag i procent
- default_estimate_markup: Kalkylpåslag i procent
- vat_percent: Moms i procent (standard 25%)

REGLER:
- Returnera ENDAST värden som användaren nämner
- Om ett värde inte nämns, inkludera det inte i svaret
- Förstå variationer som "plattsättare", "kaklare", "kakelsättare" → hourly_rate_tiler
- Förstå "påslag", "pålägg", "markup" 
- Siffror kan anges som "femhundratjugo" eller "520"

Svara ENDAST med ett JSON-objekt, inget annat.

Exempel input: "Snickare femhundratjugo kronor, målare fyrahundraåttio, materialpåslag tio procent"
Exempel output: {"hourly_rate_carpenter": 520, "hourly_rate_painter": 480, "material_markup_percent": 10}`;

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

    const pricing = JSON.parse(jsonStr);

    return new Response(
      JSON.stringify(pricing),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("parse-pricing-voice error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Kunde inte tolka priserna" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
