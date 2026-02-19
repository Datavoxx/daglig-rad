

## Varfor tar det 5 sekunder?

### Rotorsaken

Nar du skriver "Jag vill skapa en ny offert" sker foljande steg:

1. Edge function startar (snabbt, ~30ms)
2. Autentisering kontrolleras (snabbt)
3. Meddelandet matchar INGEN direkt pattern (det ar bara en allman forfragan, inte "Skapa offert X for kund med ID Y")
4. **AI-anrop till OpenAI gpt-5-mini** -- HaR aR FLASKHALSEN
5. AI:n bestammer att anropa verktyget `get_customers_for_estimate`
6. Kundlistan hamtas fran databasen
7. Svaret formateras och skickas tillbaka

### Varfor ar steg 4 sa langsamt?

Edge-funktionen skickar **50+ verktygsdefinitioner** (over 900 rader JSON) till AI-modellen varje gang. AI:n maste:
- Lasa och forsta alla verktyg
- Matcha frasen "skapa offert" mot ratt verktyg
- Generera ett tool_call-svar

Detta tar 3-5 sekunder -- bara for att AI:n ska bestamma att du vill visa ett offertformular.

### Losning: Direkt pattern-matching for vanliga kommandon

Samma teknik som redan anvands for `create_estimate` (rad 4406-4427) och `add_estimate_items` (rad 4429-4473) -- de kor verktygen DIREKT utan AI-anrop.

Vi laggar till **direktmatchning for formularvyer** i borjan av serve-handleren, INNAN AI-anropet:

```text
"skapa offert" / "ny offert"      -> get_customers_for_estimate (direkt)
"registrera tid"                  -> get_active_projects_for_time (direkt)
"skapa dagrapport" / "ny dagrapport" -> get_projects_for_daily_report (direkt)
"skapa arbetsorder"               -> get_projects_for_work_order (direkt)
"checka in"                       -> get_projects_for_check_in (direkt)
"skapa planering"                 -> get_projects_for_planning (direkt)
"ny kund"                         -> get_customer_form (direkt)
"skapa projekt"                   -> get_project_form (direkt)
"uppdatera projekt"               -> get_projects_for_update (direkt)
```

### Teknisk implementation

**Fil:** `supabase/functions/global-assistant/index.ts`

Lagg till ett block efter de befintliga direktmatchningarna (rad ~4474) men INNAN AI-anropet (rad ~4692):

```text
// === DIRECT FORM PATTERNS ===
// Bypass AI for common form-showing commands (saves 3-5 seconds)
const lowerMessage = message.toLowerCase().trim();

const formPatterns = [
  {
    patterns: [/\b(skapa|ny|skriva|göra)\b.*\boffert\b/, /\boffert\b.*\b(skapa|ny)\b/],
    tool: "get_customers_for_estimate",
    args: {},
  },
  {
    patterns: [/\bregistrera\s*tid\b/, /\btidrapport/],
    tool: "get_active_projects_for_time",
    args: {},
  },
  {
    patterns: [/\b(skapa|ny)\b.*\bdagrapport\b/, /\bdagrapport\b.*\b(skapa|ny)\b/],
    tool: "get_projects_for_daily_report",
    args: {},
  },
  // ... etc for each form command
];

for (const fp of formPatterns) {
  if (fp.patterns.some(p => p.test(lowerMessage))) {
    const result = await executeTool(supabase, userId, fp.tool, fp.args, context);
    const formatted = formatToolResults(fp.tool, result);
    return new Response(JSON.stringify(formatted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
```

### Forvantat resultat

| Fore | Efter |
|------|-------|
| "Skapa offert" -> AI-anrop (3-5 sek) -> tool call -> DB-fraga | "Skapa offert" -> DB-fraga direkt (~200ms) |
| Totaltid: ~5 sekunder | Totaltid: under 1 sekund |

### Vad paverkas INTE

- Oppna fragor ("hur gar projektet?") gar fortfarande genom AI
- Komplexa kommandon med namn/parametrar gar genom AI
- Endast tydliga formularvyer kortslutas

### Filandringar

| Fil | Andring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Lagg till ~40 rader direktmatchning for formularkommandon innan AI-anropet |

