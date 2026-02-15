

## Tydligare aktiv flik i projektvyn

### Vad ändras
Den aktiva fliken (t.ex. "Översikt") får en tydligare visuell markering så att det är uppenbart vilken flik man befinner sig i. Just nu får den aktiva fliken bara en subtil vit bakgrund och skugga -- vi förstärker detta med:

- En **underline / bottom border** i primärfärgen på den aktiva fliken
- Aktiv flik får **primärfärg på ikonen** (inte bara texten)
- Lite **starkare kontrast** mellan aktiv och inaktiv

### Teknisk ändring

**Fil:** `src/components/ui/tabs.tsx` (TabsTrigger-stilen)

Uppdatera `data-[state=active]`-klasserna:
- Lägg till `data-[state=active]:border-b-2 data-[state=active]:border-primary` för en tydlig underkant
- Lägg till `data-[state=active]:text-primary` så att text och ikon byter till primärfärgen
- Ta bort `data-[state=active]:shadow-sm` (ersätts av border-effekten)
- Justera `rounded-sm` till `rounded-none` på aktiv state (så att underline ser ren ut)

**Fil:** `src/pages/ProjectView.tsx` (TabsList)

- Ändra TabsList-bakgrunden till `bg-transparent` eller `bg-card` istället för default `bg-muted`, så att flikarna ser mer ut som en navigationsrad
- Lägg till `border-b border-border` på TabsList för en tunn linje under hela raden

Resultatet blir att den aktiva fliken sticker ut med en primärfärgad underkant och primärfärgad text/ikon, medan inaktiva flikar är gråa -- en klassisk tab-navigationsdesign.

