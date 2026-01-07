import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckpointInput {
  id: string;
  text: string;
  required: boolean;
}

interface CheckpointResult {
  id: string;
  result: "ok" | "deviation" | "na" | null;
  comment: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, checkpoints, template_name } = await req.json();

    if (!transcript || !checkpoints || checkpoints.length === 0) {
      return new Response(
        JSON.stringify({ error: "Transcript och checkpoints krävs" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const checkpointList = checkpoints.map((cp: CheckpointInput, i: number) => 
      `${i + 1}. [ID: ${cp.id}] ${cp.text}${cp.required ? ' (OBLIGATORISK)' : ''}`
    ).join('\n');

    const systemPrompt = `Du är en erfaren kvalitetskontrollant på en svensk byggarbetsplats. Din uppgift är att analysera ett transkript från en inspektion och matcha det mot en lista med kontrollpunkter.

REGLER:
- Analysera transkriptet noggrant och försök matcha information mot varje kontrollpunkt
- För varje kontrollpunkt, bestäm:
  - result: "ok" (godkänd/inga problem nämnda), "deviation" (avvikelse/problem funnet), "na" (ej tillämpbart/inte kontrollerat), eller null (ingen information)
  - comment: Relevant kommentar från transkriptet, speciellt vid avvikelser
  - confidence: 0.0-1.0 hur säker du är på bedömningen

VIKTIGT:
- Var konservativ - sätt result till null om du är osäker
- Vid avvikelser, inkludera alltid en tydlig kommentar
- "ok" betyder att punkten uttryckligen nämndes som godkänd eller att inga problem rapporterades för den
- "na" betyder att inspektören sa att punkten inte var tillämpbar eller inte kontrollerades

Svara ENDAST med valid JSON enligt detta format:
{
  "checkpoints": [
    { "id": "checkpoint_id", "result": "ok"|"deviation"|"na"|null, "comment": "...", "confidence": 0.0-1.0 }
  ],
  "summary": "Kort sammanfattning av analysen"
}`;

    const userPrompt = `Mall: ${template_name}

Kontrollpunkter att analysera:
${checkpointList}

Transkript från inspektionen:
"${transcript}"

Analysera transkriptet och returnera resultat för varje kontrollpunkt.`;

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI-tjänsten är tillfälligt överbelastad. Försök igen om en stund." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-krediter slut. Kontakta support." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Inget svar från AI");
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsedResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      parsedResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Kunde inte tolka AI-svaret");
    }

    // Validate and ensure all checkpoints have results
    const resultMap = new Map(
      parsedResult.checkpoints?.map((cp: CheckpointResult) => [cp.id, cp]) || []
    );

    const finalCheckpoints: CheckpointResult[] = checkpoints.map((cp: CheckpointInput) => {
      const aiResult = resultMap.get(cp.id) as CheckpointResult | undefined;
      return {
        id: cp.id,
        result: aiResult?.result ?? null,
        comment: aiResult?.comment ?? "",
        confidence: aiResult?.confidence ?? 0,
      };
    });

    const filledCount = finalCheckpoints.filter(cp => cp.result !== null).length;

    return new Response(
      JSON.stringify({
        checkpoints: finalCheckpoints,
        summary: parsedResult.summary || `AI analyserade ${filledCount} av ${checkpoints.length} kontrollpunkter`,
        filledCount,
        totalCount: checkpoints.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("prefill-inspection error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Ett oväntat fel uppstod" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
