import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SagaContext {
  type: "saga";
  projectName: string;
  clientName: string;
  scope: string;
  assumptions: string[];
  items: Array<{
    moment: string;
    article?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    unit_price?: number;
    subtotal?: number;
  }>;
  addons: Array<{
    name: string;
    price: number;
    is_selected?: boolean;
  }>;
  rotEnabled: boolean;
  markupPercent: number;
  totals: {
    laborCost: number;
    materialCost: number;
    subcontractorCost: number;
    totalInclVat: number;
  };
}

interface BoContext {
  type: "bo";
  projectId: string;
  projectName: string;
  clientName?: string;
  status?: string;
  phases?: Array<{
    name: string;
    startWeek: number;
    duration: number;
    tasks?: string[];
  }>;
  totalWeeks?: number;
  recentDiaryEntries?: Array<{
    report_date: string;
    work_items?: string[];
    notes?: string;
  }>;
  ataItems?: Array<{
    description: string;
    status?: string;
    estimated_cost?: number;
  }>;
  workOrders?: Array<{
    title: string;
    status?: string;
    due_date?: string;
  }>;
}

type AgentContext = SagaContext | BoContext;

function buildSagaSystemPrompt(context: SagaContext): string {
  const itemsSummary = context.items
    .map((item) => {
      const parts = [item.moment];
      if (item.article) parts.push(`[${item.article}]`);
      if (item.description) parts.push(item.description);
      if (item.quantity && item.unit)
        parts.push(`${item.quantity} ${item.unit}`);
      if (item.subtotal) parts.push(`= ${item.subtotal.toLocaleString("sv-SE")} kr`);
      return `- ${parts.join(" ")}`;
    })
    .join("\n");

  const addonsSummary = context.addons
    .map(
      (addon) =>
        `- ${addon.name}: ${addon.price.toLocaleString("sv-SE")} kr ${addon.is_selected ? "(vald)" : "(ej vald)"}`
    )
    .join("\n");

  const assumptionsList = context.assumptions.map((a) => `- ${a}`).join("\n");

  return `Du heter Saga och är en expert på offerter och kalkyler för byggprojekt i Sverige.

Du har full tillgång till den aktuella offerten som användaren arbetar med. Du kan:
- Förklara vilka poster som ingår och deras kostnader
- Berätta om ROT/RUT-avdrag och hur de påverkar slutpriset
- Ge rekommendationer om prissättning
- Svara på frågor om projektets omfattning
- Hjälpa till att förklara offerten för kunden
- Beräkna och förklara summor

Var hjälpsam, professionell och koncis. Svara alltid på svenska. Använd markdown för formatering när det passar.

AKTUELL OFFERT:
=================
Projekt: ${context.projectName || "Ej angivet"}
Kund: ${context.clientName || "Ej angivet"}

Projektbeskrivning:
${context.scope || "Ingen beskrivning"}

Tidsplan/Förutsättningar:
${assumptionsList || "Inga angivna"}

Offertposter:
${itemsSummary || "Inga poster"}

Tillägg:
${addonsSummary || "Inga tillägg"}

Ekonomi:
- Arbetskostnad: ${context.totals.laborCost.toLocaleString("sv-SE")} kr
- Materialkostnad: ${context.totals.materialCost.toLocaleString("sv-SE")} kr
- Underentreprenör: ${context.totals.subcontractorCost.toLocaleString("sv-SE")} kr
- Påslag: ${context.markupPercent}%
- ROT-avdrag: ${context.rotEnabled ? "Aktiverat" : "Ej aktiverat"}
- TOTALT: ${context.totals.totalInclVat.toLocaleString("sv-SE")} kr`;
}

function buildBoSystemPrompt(context: BoContext): string {
  const phasesSummary = context.phases
    ?.map((phase) => {
      const tasks = phase.tasks?.length
        ? `\n  Uppgifter: ${phase.tasks.join(", ")}`
        : "";
      return `- ${phase.name}: Vecka ${phase.startWeek}-${phase.startWeek + phase.duration - 1} (${phase.duration} veckor)${tasks}`;
    })
    .join("\n") || "Ingen tidsplan skapad";

  const diarySummary = context.recentDiaryEntries
    ?.slice(0, 5)
    .map((entry) => {
      const items = entry.work_items?.join(", ") || "Inga arbeten";
      return `- ${entry.report_date}: ${items}${entry.notes ? ` (${entry.notes})` : ""}`;
    })
    .join("\n") || "Inga dagrapporter";

  const ataSummary = context.ataItems
    ?.map((ata) => {
      const cost = ata.estimated_cost
        ? ` - ${ata.estimated_cost.toLocaleString("sv-SE")} kr`
        : "";
      return `- ${ata.description} [${ata.status || "pending"}]${cost}`;
    })
    .join("\n") || "Inga ÄTA";

  const workOrdersSummary = context.workOrders
    ?.map((wo) => {
      const due = wo.due_date ? ` (deadline: ${wo.due_date})` : "";
      return `- ${wo.title} [${wo.status || "pending"}]${due}`;
    })
    .join("\n") || "Inga arbetsorder";

  const statusTranslation: Record<string, string> = {
    planning: "Planering",
    active: "Pågående",
    closing: "Slutskede",
    completed: "Avslutat",
  };

  return `Du heter Bo och är en expert på byggprojektplanering och dokumentation.

Du har full tillgång till det aktuella projektet. Du kan:
- Förklara projektets tidplan och faser
- Svara på frågor om dagrapporter och dokumentation (detta är Ullas område, men du kan besvara)
- Ge information om ÄTA-ärenden (ändringar/tillägg)
- Förklara arbetsorder och deras status
- Ge rekommendationer för projektets nästa steg
- Analysera projektets framsteg

Var hjälpsam, professionell och koncis. Svara alltid på svenska. Använd markdown för formatering när det passar.

AKTUELLT PROJEKT:
=================
Projekt: ${context.projectName}
Kund: ${context.clientName || "Ej angivet"}
Status: ${statusTranslation[context.status || ""] || context.status || "Ej angivet"}

TIDSPLAN:
${phasesSummary}
${context.totalWeeks ? `Total längd: ${context.totalWeeks} veckor` : ""}

SENASTE DAGRAPPORTER (Ullas område):
${diarySummary}

ÄTA-ÄRENDEN:
${ataSummary}

ARBETSORDER:
${workOrdersSummary}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agent, messages, context } = await req.json();

    if (!agent || !messages || !context) {
      throw new Error("Missing required fields: agent, messages, context");
    }

    const systemPrompt =
      agent === "saga"
        ? buildSagaSystemPrompt(context as SagaContext)
        : buildBoSystemPrompt(context as BoContext);

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: Message) => ({ role: m.role, content: m.content })),
    ];

    // Use Lovable AI endpoint
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: apiMessages,
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Jag kunde inte generera ett svar.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Agent chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
