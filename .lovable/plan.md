

## Tre forandringar i Byggio AI:s svar

### 1. "Visa projekt" efter tidssammanfattning ska visa ratt projekt

**Problem:** Nar du far en tidssammanfattning och klickar "Visa projekt" skickas "Visa mina projekt" -- vilket listar alla 10 projekt istallet for det/de projekt du registrerade tid pa.

**Fix i:** `supabase/functions/global-assistant/index.ts` (formatToolResults, case `get_time_summary`)

- Hamta unika projektnamn fran `summary.entries` (varje entry har `projects.name`)
- Om det finns exakt 1 projekt: byt "Visa projekt" till `prompt: "visa {projektnamn}"`
- Om det finns flera: behall "Visa mina projekt" (for da ar det relevant)
- Byt aven label till projektnamnet om det bara ar ett: `label: "Visa {namn}"`

### 2. Oversiktssammanfattningen ska visas som ett kort

**Problem:** "Kan du gora en sammanfattning" returnerar `type: "text"` -- det renderas som vanlig markdown-text utan nagon visuell avgransning.

**Fix i:** `supabase/functions/global-assistant/index.ts` (formatToolResults, case `get_dashboard_summary`)

- Byt `type: "text"` till `type: "result"` -- da renderas det som ett `ResultCard` med ram, ikon och knappar
- Flytta innehallet till `data.resultMessage` och satt `data.success: true`
- Lagg till en foljdtext i `content`: "Vill du att jag kollar pa nagot specifikt projekt?"

Resultatet blir ett kort med gron bockikon, sammanfattningen inuti, och next-action-knappar -- plus en foljdfraga under kortet.

### 3. Projektsammanfattning ska ocksa visas som ett kort

**Problem:** "Kan du gora en sammanfattning pa ett projekt?" + projectnamn returnerar `type: "text"` -- samma problem, bara platt text.

**Fix i:** `supabase/functions/global-assistant/index.ts` (formatToolResults, case `get_project_overview`)

- Byt `type: "text"` till `type: "result"`
- Flytta sammanfattningen till `data.resultMessage`
- Satt `data.success: true`
- Lagg till lank till projektsidan: `data.link: { label: "Oppna projekt", href: "/projects/{id}" }`

### Sammanfattning av filandringar

| Fil | Andring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | 1. Fixa "Visa projekt"-prompt i get_time_summary 2. Byt type till "result" for get_dashboard_summary med foljdfraga 3. Byt type till "result" for get_project_overview |

Inga frontendandringar behovs -- `ResultCard`-komponenten stodjer redan `resultMessage`, `link`, `nextActions` och renderar kortet med ram och ikon.
