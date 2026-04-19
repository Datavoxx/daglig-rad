
Användaren vill ha djup research inför ett möte imorgon om:
1. Lönetyper i Byggio (vad finns, hur fungerar det)
2. Visma Lön 300 & Visma Lön 600 — hur de arbetar med lönearter, tidkoder, importfiler (TLU/SPCS)
3. En jämförelse: speglar Byggios `salary_types`-modell verkligheten i Visma 300/600?

Detta är ren research — ingen kod ska skrivas. Jag behöver:
- Läsa Byggios faktiska datamodell för `salary_types`, `time_entries`, TLU-genereringen
- Webbsökning på Visma Lön 300/600: lönearter, tidkoder, TLU/SPCS Lön-importformat, kategorier (TIM, OT1, OT2, SJK, SEM, VAB, etc.)
- Sammanställa allt i ett långt, strukturerat dokument

Eftersom plan-läget är read-only kan jag inte göra webbsökningar nu. Jag presenterar planen så användaren kan godkänna och jag växlar till default-läge för att utföra research + sammanställa rapport.

## Plan: Djupdykning Lönetyper + Visma Lön 300/600

### Mål
Leverera ett detaljerat researchdokument inför mötet imorgon som täcker:
1. **Byggios lönetypsmodell** — fältförklaringar, hur de används i tidrapportering & export
2. **Visma Lön 300 & 600** — hur de hanterar lönearter, tidkoder, importer
3. **Gap-analys** — speglar Byggios modell verkligheten? Vad saknas/överflödar?

### Steg

**1. Kartlägg Byggios nuvarande modell (kodläsning)**
- Läs `salary_types`-tabellens schema (kolumner, defaults, constraints)
- Läs `SalaryTypeManager.tsx` för UI/fältförklaring
- Läs `generateTluFile.ts` + `generatePaXmlFile.ts` för exakt hur fälten används i export
- Läs `validatePayrollExport.ts` för valideringsregler
- Läs `time_entries`-kopplingen (hur en tidpost binds till en lönetyp)

**2. Webbresearch: Visma Lön 300 & 600**
Sök officiella källor + community för:
- Skillnader Lön 300 vs Lön 600 (målgrupp, kapacitet, funktioner)
- Lönearter: standardlistan i Visma (1010 Månadslön, 1310 Timlön, 1410 Övertid 50%, etc.)
- Tidkoder vs Lönearter — hur de skiljer sig och hänger ihop
- TLU-filformatet: officiell spec, fältkrav, vanliga fel
- SPCS Lön-import som alternativ
- Hur Visma kategoriserar tidtyper (WORK/OT1/OT2/SICK/VAC/VAB)

**3. Webbresearch: Fortnox Lön (kort)**
- PAXml 2.0-spec
- Fortnox standardlönearter
- Skillnad mot Visma

**4. Sammanställ rapport** (levereras som långt chat-svar, eller som .md i `/mnt/documents/` om önskat)

Innehåll:
- **Del A:** Byggios `salary_types` — varje fält förklarat (namn, förkortning, påslag, sortering, visma_wage_code, visma_salary_type, fortnox_wage_code, fortnox_salary_type, time_type) — vad de gör, var de används, vad som händer om de saknas
- **Del B:** Visma Lön 300 vs 600 — målgrupp, prissättning, integrationskapacitet, vanliga lönearter med exempel
- **Del C:** TLU-filens uppbyggnad — varje XML-fält, vad Visma förväntar sig
- **Del D:** Standardiserade tidtyper i Sverige (kollektivavtal: Byggnads, Installatör, etc.) och hur de mappar mot lönearter
- **Del E:** Gap-analys — täcker Byggios modell allt? Saknas t.ex. kostnadsställe, projektnummer, ackord, OB-tillägg, restidsersättning?
- **Del F:** Rekommendationer inför mötet — frågor att ställa kunder, exempelmappningar för olika branscher (bygg, VVS, el)

### Leverans
Långt, strukturerat svar i chatten + valfritt en `.md`-fil i `/mnt/documents/` som du kan ta med till mötet.

### Frågor innan jag kör
- Vill du ha det som chatt-svar, nedladdningsbar `.md`/`.pdf`, eller båda?
- Ska jag fokusera på någon specifik bransch (bygg/VVS/el) i exemplen, eller täcka alla tre?
