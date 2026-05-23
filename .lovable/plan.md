
# Visuell UI-audit (endast design, ingen funktionalitet)

Baserat på screenshots från live-appen efter inloggning. Bedömningen handlar uteslutande om: layout, hierarki, spacing, typografi, färg, konsistens, polish.

## Övergripande intryck

Appen är **ren och funktionell**, men ser ut som en typisk Tailwind/shadcn-MVP — inte som en produkt i 2026. Tre problem dominerar visuellt på *varje* sida:

1. **Topp-baren är död yta** (~70px tom yta med bara sökruta + klocka i högra hörnet). Den drar ner hela appen.
2. **Cards smälter in i bakgrunden** — vit `bg-card` på varm off-white bakgrund, utan border/skugga = kort försvinner.
3. **Inkonsistent page-header-system** — varje sida har egen behandling (chip, emoji-hero, hero-kort, ren text). Inget gemensamt språk.

Snitt: **5.8/10**. Realistiskt mål: **8.5–9/10** med en designsystem-pass + 3 systemkomponenter.

---

## Per-sida (visuell rating)

| Sida | Rating | Huvudsakliga visuella problem |
|---|---|---|
| Dashboard | 6/10 | Tre konkurrerande action-lager (4 dropdowns + AI-box + 11 chips). Stor emoji-hero krockar med chip "Dashboard". KPI-rad ligger under viken. |
| Projects | 5/10 | Tom top-bar. Anonym empty state (grå ikon + text). Knappar svävar utan kontext. |
| Estimates | 5/10 | Samma som Projects. Tab-pillerna är platta, aktiv tab knappt synlig. 4 knappar i header utan visuell gruppering. |
| TimeReporting | 7/10 | Bästa rytmen — kalendern dominerar fint. Men "0.0 timmar" upprepas tre gånger på samma vy. KPI-korten under är överflödiga visuellt. |
| Invoices | 6/10 | Tonad hero-chip är bra. Tabs platta. Stort tomt utrymme under empty state. |
| Customers | 5/10 | Bar layout, ingen personlighet. |
| Settings | 4/10 | Tabs nästan osynliga (grå-på-grå). Content-kort tomt och plottrigt. Inget sidebar/anchor-system trots många kategorier. |
| Attendance | 6/10 | Trevlig 2-kolumns layout. Hero-chip OK. "Checka in"-knappen ser inaktiv ut (för ljus grön). |
| Accounting | 6/10 | Två identiska kort med "Kommande snart"-badges = visuellt monotont. |
| Guide | 7/10 | Bäst i klassen — varm, balanserad. Men hero tar hela viewport. |
| Global Assistant | 7/10 | Lugn och centrerad — det funkar. Lite för mycket whitespace upptill. |
| Profile | 6/10 | Rent formulär, men profilkortet till vänster är glest (bara namn + 1 stat). |

---

## Topp 5 "biggest wins" (systemiska — fixar 80% på en gång)

### 1. Aktivera den döda topp-baren
Just nu: 70px med sökruta vänster + klocka höger, allt annat tomt.
Lös: kompakt **app-bar** med: vänster = sidotitel + breadcrumb, mitten = global sök (kontextuell), höger = avatar + ev. publicera/snabbkommando-knapp. Skapar ett tak som ger varje sida en stabil ram.

### 2. Höj kort-ytan
Lös: ge alla `Card` en mjuk border (`border-border/60`) + subtil `shadow-sm` + lite varmare card-bakgrund så de "lyfter" 4–6px från sidan visuellt. En enda CSS-ändring lyfter hela appen.

### 3. Enhetlig PageHeader-komponent
Ersätt 4 olika header-mönster med en komponent:
- Titel (semantiskt h1, en enda storlek)
- Subtitel (muted, en rad)
- Höger-actions (max 1 primär + 1–2 ghost/icon)
- Optional KPI-strip under (4 kompakta tal)

Använd på *alla* sidor. Tar bort "olika app på varje route"-känslan.

### 4. Förbättra Tabs (Settings, Invoices)
Aktiv tab ska synas. Byt platt grå pill mot **underline-tabs** (linje under aktiv) ELLER segmented-control med tydlig solid background på aktiv. Lägg ikon vänster om varje tab-text för identifiering på 200ms.

### 5. Empty states med karaktär
Ersätt "grå ikon i cirkel + text + knapp" med:
- Illustrerad eller mönstrad bakgrund (subtil grid/dot-pattern)
- Större tomruta-rubrik med personlighet ("Inga kunder än — låt oss ändra på det")
- 2 actions (primär + sekundär "Importera")
- Mini-onboardingtips längst ner

Appen har 6+ empty states som alla ser likadana ut → enorm vinst.

---

## Sekundära förbättringar (efter top 5)

- **Dashboard:** ta bort dropdown-knapparna högst upp ELLER chip-griden under — inte båda.
- **Sidebar:** logga är pytteliten + ocentrerad. Centrera + ge konsekvent padding. Logout-ikonen är *röd* — gör den neutral (muted-foreground) tills hover.
- **Typografi:** låt rubriker skala konsekvent (h1: 24px, h2: 18px, h3: 15px). Just nu varierar h1 från 18px (Projekt) till 32px (God morgon).
- **Färganvändning:** grön används överallt (aktiv sidebar, primary, AI, hover, chips). Reservera den för *en* funktion — primära CTAs. Aktiv sidebar kan vara en neutral pill med grön accent-linje.
- **Spacing:** standardisera `space-y-6` mellan sektioner, `gap-4` i grids, `p-6` i kort. Just nu blandas `space-y-4`, `space-y-5`, `mb-2`, `mb-6` huller om buller.

---

## Leverans-uppdelning (om du vill köra)

**Pass 1 (1 commit):** Systemfix — kortstil, tabs, sidebar-polish, färgreservation, typografi-skala. **Lyfter alla sidor ~1 poäng på en gång.**

**Pass 2 (1 commit):** Ny `PageHeader`-komponent + applicera på alla 11 sidor + ny `EmptyState`-komponent.

**Pass 3 (1 commit):** Topp-bar (kontextuell) + per-sida-finputs (Dashboard rensning, TimeReporting deduplication, Settings sidebar-nav, Accounting differentiering).

Förväntat slutresultat: snitt 8.5/10, inga sidor under 8.

---

Säg **"kör pass 1"** så börjar jag med systemfixen.
