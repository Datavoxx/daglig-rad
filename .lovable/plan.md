

## Webhook för Nyregistrerade Konton

### Översikt

Skicka en webhook-notifiering till n8n varje gång ett nytt konto skapas i Byggio. Detta ger dig realtidsinformation om nya användare.

### Arkitektur

```text
┌─────────────────────────────────────────────────────────────────┐
│  Register.tsx                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. supabase.auth.signUp() ✓                            │   │
│  │  2. supabase.auth.signInWithPassword() ✓                │   │
│  │  3. supabase.functions.invoke("notify-new-account") ◄── │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Edge Function: notify-new-account                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  - Ta emot: email, full_name, user_id                   │   │
│  │  - Skicka POST till n8n webhook                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  n8n Webhook                                                    │
│  https://datavox.app.n8n.cloud/webhook/nytt-konto               │
└─────────────────────────────────────────────────────────────────┘
```

### Filer som påverkas

| Fil | Ändring |
|-----|---------|
| `supabase/functions/notify-new-account/index.ts` | **NY** - Webhook-notifiering |
| `supabase/config.toml` | Lägg till notify-new-account function |
| `src/pages/Register.tsx` | Anropa edge function efter lyckad registrering |

### Teknisk implementation

#### 1. Ny Edge Function: notify-new-account

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ...",
};

const N8N_WEBHOOK_URL = "https://datavox.app.n8n.cloud/webhook/nytt-konto";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name, user_id } = await req.json();

    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        full_name,
        user_id,
        registered_at: new Date().toISOString(),
        source: "byggio-web",
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-new-account:", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

#### 2. Uppdatera Register.tsx

Efter lyckad inloggning (rad 95-97), lägg till webhook-anrop:

```typescript
// Efter lyckad auto-login
} else {
  // Skicka webhook för nytt konto (fire-and-forget)
  supabase.functions.invoke("notify-new-account", {
    body: {
      email,
      full_name: fullName,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    },
  }).catch(console.error);

  toast({ title: "Välkommen till Byggio!" });
  navigate("/dashboard");
}
```

#### 3. Uppdatera config.toml

```toml
[functions.notify-new-account]
verify_jwt = false
```

### Data som skickas till n8n

```json
{
  "email": "nyanvandare@example.com",
  "full_name": "Anna Andersson",
  "user_id": "uuid-xxx",
  "registered_at": "2026-02-01T21:00:00.000Z",
  "source": "byggio-web"
}
```

### Fördelar

- **Realtidsnotifiering** - Du får veta om nya konton direkt
- **Fire-and-forget** - Blockerar inte användarupplevelsen
- **Konsekvent mönster** - Samma arkitektur som error-rapportering
- **Ingen databasändring** - Allt sker via edge function

