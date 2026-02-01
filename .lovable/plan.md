

## Error Webhook Monitoring för Edge Functions

### Översikt

Implementera ett centraliserat error-monitoring-system som skickar en webhook till n8n varje gång ett fel uppstår i någon av edge functions. Detta ger dig realtidsnotifieringar om alla fel i systemet.

### Arkitektur

```text
┌─────────────────────────────────────────────────────────────────┐
│  Edge Function (t.ex. generate-report)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  try {                                                   │   │
│  │    // normal logic                                       │   │
│  │  } catch (error) {                                       │   │
│  │    await reportError({ ... })  ◄── Nytt anrop            │   │
│  │    return Response(500)                                  │   │
│  │  }                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Edge Function: report-error                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  - Ta emot: function_name, error, context               │   │
│  │  - Logga till console                                    │   │
│  │  - Skicka POST till n8n webhook                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  n8n Webhook                                                    │
│  https://datavox.app.n8n.cloud/webhook/error-byggio             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  - Mottag error data                                     │   │
│  │  - Skicka notifiering (Slack, email, etc.)              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Filer som påverkas

| Fil | Ändring |
|-----|---------|
| `supabase/functions/report-error/index.ts` | **NY** - Central error-rapportering |
| `supabase/config.toml` | Lägg till report-error function |
| `supabase/functions/generate-report/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/transcribe-audio/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/generate-plan/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/prefill-inspection/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/send-employee-invitation/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/extract-vendor-invoice/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/generate-estimate/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/apply-voice-edits/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/apply-estimate-voice-edits/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/apply-full-estimate-voice/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/apply-summary-voice-edits/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/parse-template-voice/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/accept-invitation/index.ts` | Lägg till reportError() anrop |
| `supabase/functions/validate-invitation/index.ts` | Lägg till reportError() anrop |

### Implementation

#### 1. Ny Edge Function: report-error

Denna funktion tar emot error-information och skickar till n8n:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL = "https://datavox.app.n8n.cloud/webhook/error-byggio";

interface ErrorReport {
  function_name: string;
  error_message: string;
  error_stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  severity: "error" | "warning" | "critical";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const errorReport: ErrorReport = await req.json();

    console.log(`[ERROR REPORT] ${errorReport.function_name}: ${errorReport.error_message}`);

    // Skicka till n8n webhook
    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...errorReport,
        environment: Deno.env.get("ENVIRONMENT") || "production",
        project: "byggio",
      }),
    });

    if (!webhookResponse.ok) {
      console.error("Failed to send to n8n:", await webhookResponse.text());
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Vi loggar bara här, ingen rekursiv rapportering
    console.error("Error in report-error function:", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

#### 2. Helper-funktion för varje edge function

Lägg till denna funktion överst i varje edge function:

```typescript
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
    // Tysta fel här för att inte krascha huvudlogiken
    console.error("Failed to report error:", reportErr);
  }
}
```

#### 3. Uppdatera catch-block i alla edge functions

Exempel för generate-report:

```typescript
} catch (error) {
  console.error("Error in generate-report:", error);
  
  // Ny rad: Skicka error till webhook
  await reportError("generate-report", error, { 
    transcript_length: transcript?.length,
    project_id 
  });
  
  return new Response(
    JSON.stringify({ error: error instanceof Error ? error.message : "Okänt fel" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Data som skickas till n8n

Varje error-rapport innehåller:

```json
{
  "function_name": "generate-report",
  "error_message": "AI gateway error: 500",
  "error_stack": "Error: AI gateway error: 500\n    at ...",
  "context": {
    "transcript_length": 1234,
    "project_id": "uuid-xxx"
  },
  "timestamp": "2026-02-01T20:30:00.000Z",
  "severity": "error",
  "environment": "production",
  "project": "byggio"
}
```

### Fördelar

- **Realtidsnotifieringar** - Du får veta om fel direkt
- **Ingen data i databasen** - Allt skickas till n8n för extern hantering
- **Minimal overhead** - Fire-and-forget, blockerar inte huvudlogiken
- **Kontext inkluderad** - Varje fel har relevant metadata för debugging
- **Centraliserad lösning** - En enda funktion hanterar all rapportering

### Säkerhetshänsyn

- Webhook-URL:en är hårdkodad men kan flyttas till en secret om önskat
- Inga känsliga användardata inkluderas i error-rapporter (bara metadata)
- rate-limit errors (429) och payment errors (402) rapporteras också

