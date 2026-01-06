import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, mimeType } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received audio for transcription, mimeType:", mimeType);

    // Determine the format for Gemini based on mimeType
    let format = "webm";
    if (mimeType?.includes("mp4")) {
      format = "mp4";
    } else if (mimeType?.includes("ogg")) {
      format = "ogg";
    } else if (mimeType?.includes("wav")) {
      format = "wav";
    }

    // Call Lovable AI Gateway with Gemini for audio transcription
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
            role: "system",
            content: `Du är en professionell transkriberings-assistent för byggbranschen. 
Din uppgift är att lyssna på ljudinspelningen och skriva ut exakt vad som sägs på svenska.
- Skriv ut texten ordagrant men med korrekt interpunktion
- Korrigera uppenbara talfel och felsägningar för läsbarhet
- Behåll byggterminologi och fackuttryck korrekt
- Om det är svårt att höra något, skriv [ohörbart]
- Returnera ENDAST den transkriberade texten, ingen annan text eller förklaring`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transkribera följande ljudinspelning:"
              },
              {
                type: "input_audio",
                input_audio: {
                  data: audio,
                  format: format
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
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
    const transcribedText = data.choices?.[0]?.message?.content || "";

    console.log("Transcription successful, length:", transcribedText.length);

    return new Response(
      JSON.stringify({ text: transcribedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Transcription error:", error);
    const message = error instanceof Error ? error.message : "Transkribering misslyckades";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
