import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type FormType = "daily-report" | "estimate" | "work-order" | "customer" | "time" | "estimate-items";

interface RequestBody {
  transcript: string;
  formType: FormType;
  context?: {
    projectId?: string;
  };
}

function getSystemPrompt(formType: FormType): string {
  const basePrompt = `Du är en AI-assistent som extraherar strukturerad data från rösttranskriptioner för byggföretag i Sverige. 
Svara ENDAST med giltig JSON, ingen annan text.
Om information saknas, använd null eller tomma strängar.
Tolka svenska mått, tider och termer korrekt.`;

  switch (formType) {
    case "daily-report":
      return `${basePrompt}

Extrahera dagrapportdata från transkriptet. Returnera JSON med följande struktur:
{
  "headcount": number | null,           // Antal personer som jobbade
  "hoursPerPerson": number | null,      // Timmar per person
  "roles": string[],                     // Yrkesroller (t.ex. ["snickare", "elektriker"])
  "workItems": string[],                 // Lista med utfört arbete
  "materialsDelivered": string,          // Material som levererats
  "materialsMissing": string,            // Material som saknas
  "notes": string,                       // Övriga anteckningar
  "deviations": [                        // Avvikelser
    {
      "type": "waiting_time" | "material_delay" | "weather" | "coordination" | "equipment" | "safety" | "quality" | "other",
      "description": string,
      "hours": number | null
    }
  ],
  "ata": [                               // ÄTA-arbeten
    {
      "reason": string,
      "consequence": string,
      "estimatedHours": number | null
    }
  ]
}`;

    case "estimate":
      return `${basePrompt}

Extrahera offertdata från transkriptet. Returnera JSON med följande struktur:
{
  "title": string,           // Projektnamn/titel
  "address": string,         // Projektadress
  "description": string      // Beskrivning av arbetet
}`;

    case "work-order":
      return `${basePrompt}

Extrahera arbetsorderdata från transkriptet. Returnera JSON med följande struktur:
{
  "title": string,           // Titel på arbetsordern
  "description": string,     // Detaljerad beskrivning
  "dueDate": string | null   // Förfallodatum i format YYYY-MM-DD om nämnt
}`;

    case "customer":
      return `${basePrompt}

Extrahera kundinformation från transkriptet. Returnera JSON med följande struktur:
{
  "name": string,            // Kundens namn
  "email": string,           // E-postadress
  "phone": string,           // Telefonnummer
  "address": string,         // Gatuadress
  "city": string             // Stad
}`;

    case "time":
      return `${basePrompt}

Extrahera tidsregistreringsdata från transkriptet. Returnera JSON med följande struktur:
{
  "hours": number | null,     // Antal timmar
  "description": string,      // Beskrivning av arbetet
  "date": string | null       // Datum i format YYYY-MM-DD om nämnt
}`;

    case "estimate-items":
      return `${basePrompt}

Extrahera offertposter från transkriptet. Returnera JSON med följande struktur:
{
  "introduction": string,    // Projektbeskrivning
  "timeline": string,        // Tidsplan (en punkt per rad)
  "items": [
    {
      "article": string,     // Kategori: Arbete, Bygg, Material, etc.
      "description": string, // Beskrivning av arbetet
      "quantity": number | null,    // Antal
      "unit": string,        // Enhet: tim, st, m, m², etc.
      "unit_price": number   // Pris per enhet
    }
  ],
  "addons": [
    {
      "name": string,        // Namn på tillval
      "price": number        // Pris för tillval
    }
  ]
}

Vanliga kategorier (article): Arbete, Bygg, Deponi, Framkörning, Förbrukning, Förvaltning, Markarbete, Maskin, Material, Målning, Snöröjning, Städ, Trädgårdsskötsel
Vanliga enheter (unit): tim, st, m, m², m³, kg, kpl`;

    default:
      return basePrompt;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { transcript, formType, context } = (await req.json()) as RequestBody;

    console.log("[extract-form-data] Processing transcript for formType:", formType);
    console.log("[extract-form-data] Transcript length:", transcript?.length);
    console.log("[extract-form-data] Context:", JSON.stringify(context));

    if (!transcript?.trim()) {
      return new Response(
        JSON.stringify({ error: "Inget transkript att bearbeta" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!formType) {
      return new Response(
        JSON.stringify({ error: "Formulärtyp saknas" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const systemPrompt = getSystemPrompt(formType);

    // Use Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("[extract-form-data] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI-tjänsten är inte konfigurerad" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const _aiStartTime = Date.now();
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
          { role: "user", content: `Transkript: "${transcript}"` },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[extract-form-data] OpenRouter API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI-tjänsten kunde inte nås" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("[extract-form-data] AI response:", content);

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Inget svar från AI" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(content);
    } catch (parseError) {
      console.error("[extract-form-data] Failed to parse AI response:", parseError);
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        return new Response(
          JSON.stringify({ error: "Kunde inte tolka AI-svaret" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }

    console.log("[extract-form-data] Extracted data:", JSON.stringify(extractedData));

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
          await svcClient.from("ai_usage_logs").insert({ user_id: userData.user.id, function_name: "extract-form-data", model: "google/gemini-2.5-flash", tokens_in: data.usage?.prompt_tokens, tokens_out: data.usage?.completion_tokens, response_time_ms: _aiEndTime - _aiStartTime, output_size: content?.length || 0 });
        }
      }
    } catch (_) {}

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[extract-form-data] Error:", error);
    return new Response(
      JSON.stringify({ error: "Ett fel uppstod vid bearbetning" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
