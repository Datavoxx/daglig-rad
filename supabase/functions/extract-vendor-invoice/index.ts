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

interface ExtractedInvoice {
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_ex_vat: number;
  vat_amount: number;
  total_inc_vat: number;
  rows: Array<{
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    subtotal: number;
  }>;
  suggested_project?: string;
  extractionMethod?: "pdf" | "image_fallback";
}

interface ExtractionResult {
  success: boolean;
  data?: ExtractedInvoice;
  error?: string;
}

const extractionPrompt = `Analysera denna leverantörsfaktura. Extrahera följande information och returnera som JSON:

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

function shouldRetryAsImage(errorMessage: string): boolean {
  const retryableErrors = [
    "The document has no pages",
    "Unable to process PDF",
    "Invalid document format",
    "Could not parse document",
    "INVALID_ARGUMENT",
    "cannot be processed",
    "unsupported format"
  ];
  return retryableErrors.some(e => errorMessage.toLowerCase().includes(e.toLowerCase()));
}

async function tryExtract(
  base64: string,
  mimeType: string,
  apiKey: string
): Promise<ExtractionResult> {
  console.log(`Extraction attempt: mimeType=${mimeType}, base64Length=${base64.length}`);
  
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: extractionPrompt },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error (${response.status}):`, errorText);
      
      if (response.status === 429) {
        return { success: false, error: "För många förfrågningar. Försök igen om en stund." };
      }
      if (response.status === 402) {
        return { success: false, error: "AI-kvot uppnådd. Kontakta support." };
      }
      
      return { success: false, error: errorText };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response received, parsing JSON...");
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No valid JSON found in response:", content.substring(0, 200));
      return { success: false, error: "No valid JSON in AI response" };
    }
    
    const extracted = JSON.parse(jsonMatch[0]) as ExtractedInvoice;
    console.log("Successfully extracted data:", extracted.supplier_name);
    
    return { success: true, data: extracted };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Extraction error:", message);
    return { success: false, error: message };
  }
}

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

    console.log(`Processing file: ${fileName || "unknown"}, size: ${pdfBase64.length} chars`);

    // Attempt 1: Try direct PDF extraction
    console.log("Attempt 1: Direct PDF extraction with Gemini Pro...");
    let result = await tryExtract(pdfBase64, "application/pdf", LOVABLE_API_KEY);
    
    // Attempt 2: If PDF failed with retryable error, try as image
    if (!result.success && result.error && shouldRetryAsImage(result.error)) {
      console.log("PDF extraction failed with retryable error, trying image fallback...");
      console.log("Error was:", result.error);
      
      result = await tryExtract(pdfBase64, "image/png", LOVABLE_API_KEY);
      
      if (result.success && result.data) {
        result.data.extractionMethod = "image_fallback";
        console.log("Image fallback succeeded!");
      }
    }

    // Check final result
    if (!result.success) {
      console.error("All extraction attempts failed:", result.error);
      await reportError("extract-vendor-invoice", new Error(result.error || "Extraction failed"), { 
        fileName, 
        base64Length: pdfBase64.length 
      });
      return new Response(JSON.stringify({ 
        error: result.error || "Kunde inte extrahera data från fakturan",
        details: "Försök med en tydligare bild eller manuell inmatning"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark extraction method if not already set
    if (result.data && !result.data.extractionMethod) {
      result.data.extractionMethod = "pdf";
    }

    console.log(`Extraction complete. Method: ${result.data?.extractionMethod}`);

    // Log AI usage (enhanced)
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const svcClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
        const { data: userData } = await userClient.auth.getUser();
        if (userData?.user) {
          await svcClient.from("ai_usage_logs").insert({ user_id: userData.user.id, function_name: "extract-vendor-invoice", model: "google/gemini-2.5-pro", input_size: pdfBase64.length });
        }
      }
    } catch (_) {}

    return new Response(JSON.stringify({ extracted: result.data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Request processing error:", error);
    await reportError("extract-vendor-invoice", error, { endpoint: "extract-vendor-invoice" });
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
