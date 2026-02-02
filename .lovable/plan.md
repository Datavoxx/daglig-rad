

## Plan: Lägg till formulär för bokföringsintegrations-intresse

### Sammanfattning

Du vill:
1. **Lägga till ett formulär** under Fortnox/Visma-sektionen på Bokföringsfliken
2. **Formuläret ska innehålla:**
   - Val av program: Fortnox, Visma, eller Annat
   - Telefonnummer (enda textfältet)
3. **När man skickar formuläret:**
   - Hämtar namn och email från inloggad användare automatiskt
   - Skickar till webhook: `https://datavox.app.n8n.cloud/webhook/bokforing`

---

### Teknisk implementation

#### 1. Skapa Edge Function för webhook

**Ny fil: `supabase/functions/request-accounting-integration/index.ts`**

En edge function som:
- Tar emot: `email`, `full_name`, `phone`, `program`
- Skickar till n8n webhook
- Hanterar CORS

```typescript
const N8N_WEBHOOK_URL = "https://datavox.app.n8n.cloud/webhook/bokforing";

// Skickar till webhook:
{
  email: "user@example.com",
  full_name: "Användarens Namn",
  phone: "+46701234567",
  program: "fortnox" | "visma" | "annat",
  requested_at: "2026-02-02T..."
}
```

#### 2. Uppdatera Invoices.tsx

Lägg till under Fortnox/Visma-korten:

**Nytt formulär-sektion:**
```
+------------------------------------------+
| 🔔 Intresseanmälan                        |
|                                          |
| Välj program:                            |
| ○ Fortnox  ○ Visma  ○ Annat              |
|                                          |
| Telefonnummer                            |
| [+46 70 123 45 67                     ]  |
|                                          |
| [ Skicka intresseanmälan ]               |
+------------------------------------------+
```

**Implementation:**
- Använd `RadioGroup` för programval
- `Input` för telefonnummer
- `Button` för skicka
- Hämta användarinfo från Supabase auth
- Visa toast vid framgång/fel

---

### Filer som skapas/ändras

| Fil | Ändring |
|-----|---------|
| `supabase/functions/request-accounting-integration/index.ts` | **NY** - Edge function för n8n webhook |
| `supabase/config.toml` | Lägg till ny function config |
| `src/pages/Invoices.tsx` | Lägg till intresseanmälan-formulär |

---

### Design för formuläret

Formuläret placeras efter de två integrationskorten och innan footer-texten:

```typescript
// State
const [selectedProgram, setSelectedProgram] = useState<string>("fortnox");
const [phone, setPhone] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);

// Hämta användarinfo
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from("profiles")
  .select("full_name")
  .eq("id", user.id)
  .single();

// Skicka till edge function
const handleSubmit = async () => {
  await supabase.functions.invoke("request-accounting-integration", {
    body: {
      email: user.email,
      full_name: profile.full_name,
      phone,
      program: selectedProgram,
    }
  });
  toast.success("Din intresseanmälan har skickats!");
};
```

**UI:**
```tsx
<div className="bg-card rounded-2xl border p-8 max-w-xl mx-auto">
  <h3 className="text-lg font-semibold mb-4">
    🔔 Intresseanmälan för bokföringsintegration
  </h3>
  
  <RadioGroup value={selectedProgram} onValueChange={setSelectedProgram}>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="fortnox" id="fortnox" />
      <Label htmlFor="fortnox">Fortnox</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="visma" id="visma" />
      <Label htmlFor="visma">Visma</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="annat" id="annat" />
      <Label htmlFor="annat">Annat program</Label>
    </div>
  </RadioGroup>
  
  <Input
    type="tel"
    placeholder="+46 70 123 45 67"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
  />
  
  <Button onClick={handleSubmit} disabled={!phone || isSubmitting}>
    Skicka intresseanmälan
  </Button>
</div>
```

---

### Edge Function

**`supabase/functions/request-accounting-integration/index.ts`:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL = "https://datavox.app.n8n.cloud/webhook/bokforing";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name, phone, program } = await req.json();

    console.log(`[ACCOUNTING REQUEST] ${email} wants ${program}`);

    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        full_name,
        phone,
        program,
        requested_at: new Date().toISOString(),
        source: "byggio-web",
      }),
    });

    if (!webhookResponse.ok) {
      console.error("Failed to send to n8n:", await webhookResponse.text());
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

### Resultat

1. Användare på /invoices → Bokföringsfliken
2. Ser Fortnox + Visma-kort (som förut)
3. Under korten: nytt intresseanmälan-formulär
4. Väljer program (Fortnox/Visma/Annat)
5. Skriver telefonnummer
6. Klickar "Skicka"
7. Edge function hämtar deras namn/email och skickar till n8n webhook
8. Toast bekräftar att förfrågan skickats

