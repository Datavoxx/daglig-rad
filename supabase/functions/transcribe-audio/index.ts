import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, mimeType, durationMs } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Log audio metadata for debugging
    const audioSizeKB = Math.round(audio.length * 0.75 / 1024); // Base64 to bytes approx
    console.log("[transcribe-audio] Received audio:", {
      mimeType,
      sizeKB: audioSizeKB,
      durationMs: durationMs || "unknown",
      base64Length: audio.length,
    });

    // Sanity check: if audio is suspiciously small, return early
    if (audioSizeKB < 3) {
      console.log("[transcribe-audio] Audio too small, likely silent or corrupt");
      return new Response(
        JSON.stringify({ text: "[ohörbart]" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the audio data URI for multimodal API
    const audioMimeType = mimeType || "audio/mp4";
    const audioDataUri = `data:${audioMimeType};base64,${audio}`;
    
    console.log("[transcribe-audio] Using audio data-URI format, mimeType:", audioMimeType);

    // Call Lovable AI Gateway with data-URI format (compatible with multimodal APIs)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0,
        top_p: 0.1,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: `Du är en strikt transkriberings-assistent. Din ENDA uppgift är att skriva ut EXAKT vad som sägs i ljudinspelningen på svenska.

KRITISKA REGLER:
1. Skriv ut texten ORDAGRANT - ändra absolut inte ord, meningar eller ordning
2. Om du inte kan höra tydligt vad som sägs, returnera exakt: [ohörbart]
3. GISSA INTE! Om ljudet är otydligt, tyst eller korrupt, returnera: [ohörbart]
4. Hitta inte på text som inte finns i ljudet
5. Returnera ENDAST den transkriberade texten - ingen förklaring, ingen inledning, inget annat
6. Använd korrekt svensk interpunktion

Om inspelningen är tyst eller inte innehåller tydligt tal, returnera: [ohörbart]`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transkribera följande ljudinspelning ordagrant:"
              },
              {
                type: "image_url",
                image_url: {
                  url: audioDataUri
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[transcribe-audio] AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "För många förfrågningar. Vänta en stund och försök igen." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Betalning krävs. Lägg till krediter i din Lovable-arbetsyta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const transcribedText = data.choices?.[0]?.message?.content?.trim() || "";

    console.log("[transcribe-audio] Transcription result, length:", transcribedText.length, "text preview:", transcribedText.substring(0, 100));

    // Post-processing: If response is suspiciously long compared to audio duration, it might be hallucinated
    if (durationMs && durationMs > 0) {
      // Rough heuristic: ~150 words per minute = ~2.5 words per second = ~15 chars per second
      const expectedMaxChars = Math.round((durationMs / 1000) * 25); // generous: 25 chars/sec
      if (transcribedText.length > expectedMaxChars && transcribedText.length > 200) {
        console.log("[transcribe-audio] Response suspiciously long vs duration. Expected max:", expectedMaxChars, "got:", transcribedText.length);
        // Don't reject, but log for debugging
      }
    }

    return new Response(
      JSON.stringify({ text: transcribedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[transcribe-audio] Error:", error);
    await reportError("transcribe-audio", error, { endpoint: "transcribe-audio" });
    const message = error instanceof Error ? error.message : "Transkribering misslyckades";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
