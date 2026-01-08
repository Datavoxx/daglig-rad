import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlanPhase {
  name: string;
  start_week: number;
  duration_weeks: number;
  color: string;
  parallel_with?: string;
  description?: string;
}

interface GeneratedPlan {
  phases: PlanPhase[];
  total_weeks: number;
  confidence: number;
  summary: string;
}

const PHASE_COLORS = ['slate', 'blue', 'emerald', 'amber', 'purple', 'rose', 'cyan', 'orange'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, project_name } = await req.json();

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'Transcript is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating plan from transcript:', transcript.substring(0, 200));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Du är en expert på byggprojektplanering. Din uppgift är att tolka en fri beskrivning av ett byggprojekt och skapa en strukturerad tidsplan.

KVALITETSKRAV - MYCKET VIKTIGT:
- Om beskrivningen är för vag eller saknar konkret information om VAD som ska göras, returnera ett objekt med needs_more_info: true
- En giltig beskrivning MÅSTE innehålla MINST ETT av följande:
  * Typ av arbete (t.ex. renovering, nybygge, installation, badrumsrenovering)
  * Specifika arbetsmoment (t.ex. rivning, målning, elinstallation, kakelsättning)
  * Vad som ska hända under olika veckor/perioder
- Endast tidsangivelser som "6 veckor" eller "ett projekt på X veckor" är INTE tillräckligt!
- Om någon bara säger "vi har ett projekt på 6 veckor" utan att beskriva VAD som ska göras - det är för vagt!

Om inputen är för vag, returnera ENDAST:
{
  "needs_more_info": true,
  "missing": ["Vad som ska göras i projektet", "Vilka arbetsmoment som ingår"],
  "example": "Beskriv t.ex: 'Vecka 1-2: Rivning av befintligt kök och förberedelser. Vecka 3: El och VVS-installation. Vecka 4-5: Montering av nytt kök och bänkskivor. Vecka 6: Slutbesiktning och städning.'"
}

Om inputen innehåller tillräcklig information om arbetet:
- Tolka beskrivningen och fyll i rimliga antaganden för detaljer
- Om tider inte nämns, gör rimliga uppskattningar baserat på branschstandard
- Identifiera om arbeten kan ske parallellt
- Var konservativ med tidsuppskattningar (hellre för lång tid än för kort)

Returnera då ett JSON-objekt med följande struktur:
{
  "phases": [
    {
      "name": "Fasens namn",
      "start_week": 1,
      "duration_weeks": 2,
      "color": "slate",
      "parallel_with": null,
      "description": "Kort beskrivning av vad som ska göras i denna fas (1-2 meningar)"
    }
  ],
  "total_weeks": 10,
  "confidence": 0.85,
  "summary": "Kort sammanfattning av planeringen"
}

Tillgängliga färger: slate, blue, emerald, amber, purple, rose, cyan, orange

Om faser kan ske parallellt, sätt parallel_with till namnet på den andra fasen och samma start_week.

Confidence ska vara mellan 0 och 1 baserat på hur tydlig beskrivningen var.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Projektnamn: ${project_name || 'Okänt projekt'}\n\nBeskrivning från användaren:\n${transcript}` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'För många förfrågningar. Vänta en stund och försök igen.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Krediter slut. Lägg till mer kredit i ditt Lovable-konto.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response:', content);

    // Parse the JSON response
    let plan;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      plan = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Kunde inte tolka AI-svaret. Försök igen.');
    }

    // Check if AI needs more info - return early before processing phases
    if (plan.needs_more_info) {
      console.log('AI needs more info, returning needs_more_info response');
      return new Response(
        JSON.stringify({
          needs_more_info: true,
          missing: plan.missing || [],
          example: plan.example || "Beskriv vilka arbetsmoment som ska utföras.",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and assign colors if missing
    plan.phases = plan.phases.map((phase: any, index: number) => ({
      ...phase,
      color: phase.color || PHASE_COLORS[index % PHASE_COLORS.length],
      start_week: phase.start_week || 1,
      duration_weeks: phase.duration_weeks || 1,
    }));

    // Calculate total weeks if not provided
    if (!plan.total_weeks) {
      const maxEnd = Math.max(...plan.phases.map((p: any) => p.start_week + p.duration_weeks - 1));
      plan.total_weeks = maxEnd;
    }

    console.log('Generated plan:', JSON.stringify(plan, null, 2));

    return new Response(
      JSON.stringify(plan),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-plan function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Ett fel uppstod' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
