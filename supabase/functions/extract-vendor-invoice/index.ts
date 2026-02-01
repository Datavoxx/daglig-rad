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
    const { pdfBase64, fileName } = await req.json();
    
    if (!pdfBase64) {
      return new Response(JSON.stringify({ error: "No PDF data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const prompt = `Analysera denna leverantörsfaktura (PDF). Extrahera följande information och returnera som JSON:

{
  "supplier_name": "Leverantörens namn",
  "invoice_number": "Fakturanummer",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "total_ex_vat": 0,
  "vat_amount": 0,
  "total_inc_vat": 0,
  "rows": [
    {"description": "Beskrivning", "quantity": 1, "unit": "st", "unit_price": 0, "subtotal": 0}
  ],
  "suggested_project": "Om du hittar projektreferens i fakturan, ange den här"
}

Svara ENDAST med giltig JSON, ingen annan text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:application/pdf;base64,${pdfBase64}` } }
          ]}
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI Gateway error:", error);
      throw new Error("AI extraction failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON in AI response");
    }
    
    const extracted = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Extraction error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
