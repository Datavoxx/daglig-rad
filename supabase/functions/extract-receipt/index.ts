import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const extractionPrompt = `Du är en kvittoläsare. Analysera detta kvitto/receipt noggrant och extrahera ALL information.

Returnera EXAKT detta JSON-format:

{
  "store_name": "Butiksnamn",
  "org_number": "Organisationsnummer om synligt",
  "receipt_number": "Kvittonummer",
  "receipt_date": "YYYY-MM-DD",
  "payment_method": "VISA/MC, Swish, Kontant etc.",
  "items": [
    { "description": "Artikelnamn", "amount": 0.00, "vat_rate": 25 }
  ],
  "vat_breakdown": [
    { "vat_rate": 25, "net_amount": 0.00, "vat_amount": 0.00, "total": 0.00 }
  ],
  "total_ex_vat": 0.00,
  "total_vat": 0.00,
  "total_inc_vat": 0.00
}

Viktigt:
- "amount" per artikel = det belopp som står på kvittot (inkl. moms).
- "vat_rate" per artikel: leta efter momsuppdelning längst ner. Vanliga satser: 0%, 6%, 12%, 25%.
- "vat_breakdown" ska ha en rad per momssats som finns på kvittot.
- Om kvittot inte visar momsuppdelning explicit, anta 25% moms.
- Alla belopp i SEK som decimaltal.
- Svara ENBART med giltig JSON, ingen annan text.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, fileName } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log(`Processing receipt: ${fileName || "unknown"}, size: ${imageBase64.length} chars`);

    const startTime = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: extractionPrompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error (${response.status}):`, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "För många förfrågningar. Försök igen om en stund." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-kvot uppnådd." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI-extrahering misslyckades" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const endTime = Date.now();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No valid JSON in response:", content.substring(0, 300));
      return new Response(JSON.stringify({ error: "Kunde inte tolka kvittot" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(jsonMatch[0]);
    console.log(`Receipt extracted: ${extracted.store_name}, total: ${extracted.total_inc_vat}`);

    // Log AI usage
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const svcClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: userData } = await userClient.auth.getUser();
        if (userData?.user) {
          await svcClient.from("ai_usage_logs").insert({
            user_id: userData.user.id,
            function_name: "extract-receipt",
            model: "google/gemini-2.5-flash",
            tokens_in: data.usage?.prompt_tokens,
            tokens_out: data.usage?.completion_tokens,
            response_time_ms: endTime - startTime,
            input_size: imageBase64.length,
            output_size: JSON.stringify(extracted).length,
          });
        }
      }
    } catch (_) {}

    return new Response(JSON.stringify({ extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Receipt extraction error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
