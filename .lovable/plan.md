

## Uppdatera Guide-modulen till verkligheten

### Sammanfattning

Uppdatera alla tre guide-filer sa att de speglar Byggios faktiska funktioner idag. Ta bort Ekonomi-sektionen helt. Lagg INTE till Egenkontroller eller Loneexport. Fixa PDF-teckenkodning (a, a, o).

---

### 1. `src/pages/Guide.tsx` (inloggad guide)

**Ta bort:**
- Hela "Ekonomi och Uppfoljning"-accordionen (rad 293-343)
- Ta bort oanvanda imports: `PiggyBank`, `TrendingUp`

**Lagg till nya accordion-sektioner:**

**a) Tidsrapportering**
- Ikon: `Clock`
- Beskrivning: Rapportera arbetstid per projekt och anstall. Manads- och veckovyer, attestering, periodhantering.
- Sub-features: Kalendervyer (manad/vecka), Tidsregistrering per projekt, Attestering av tidposter, Periodlasning
- Lank: `/time-reporting`

**b) Dagrapporter**
- Ikon: `BookOpen`
- Beskrivning: Dokumentera arbetsdagen med rostinspelning. AI strukturerar rapporten automatiskt.
- Sub-features: Rostinspelning fran faltet, AI-strukturerad dokumentation, Koppla till projekt, Exportera som PDF
- Lank: `/daily-reports`

**c) Personalliggare / Narvaro**
- Ikon: `ClipboardCheck`
- Beskrivning: Digital personalliggare med QR-kodincheckining. Se vilka som ar pa plats i realtid.
- Sub-features: QR-kodscanning, Realtidsoversikt aktiva, Narvarohistorik, Skatteverks-kompatibel
- Lank: `/attendance`

**d) Fakturor**
- Ikon: `Landmark`
- Beskrivning: Hantera kund- och leverantorsfakturor. Skapa fakturor, scanna kvitton, exportera.
- Sub-features: Kundfakturor, Leverantorsfakturor, Kvittoscanning, PDF-export
- Lank: `/invoices`

**e) AI-assistenten (Byggio AI)**
- Ikon: `Sparkles`
- Beskrivning: Fraga Byggio AI vad som helst. Skapa projekt, offerter, tidrapporter och mer med rost eller text.
- Sub-features: Rostsyrning, Skapa poster via chat, Sok och analysera data, Intelligent hjalp
- Lank: `/global-assistant`

**Uppdatera ordning:** Projekt, Offerter, Tidsrapportering, Dagrapporter, Personalliggare, Fakturor, Kundhantering, AI-assistenten

---

### 2. `src/lib/generateGuidePdf.ts` (PDF-generering)

**Fixa svenska tecken:**
All text i PDF:en saknar a, a, o. Byt ut alla forekomster:
- "igang" -> "igang" (med korrekt a)
- "hjartat" -> "hjartat" (med korrekt a)
- osv.

**Problemet**: jsPDF:s default Helvetica-font stodjer INTE a, a, o. Losningen ar att anvanda ASCII-nara alternativ som fungerar, dvs. skriva texten utan specialtecken men pa ett korrekt satt, ELLER byta strategi.

**Realistisk losning**: Skriv om all PDF-text med korrekta svenska tecken. jsPDF Helvetica stodjer faktiskt de flesta Latin-1-tecken inklusive a, a, o nar man anvander ratt teckenkodning. Problemet i koden ar att texten redan ar skriven UTAN dessa tecken (t.ex. "igang" istallet for "igang"). Sa fixen ar att helt enkelt skriva texten ratt.

**Ta bort:** "EKONOMI & UPPFOLJNING"-sektionen (rad 165-174)

**Lagg till sektioner for:**
- Tidsrapportering
- Dagrapporter
- Personalliggare
- Fakturor
- AI-assistenten

---

### 3. `src/pages/GuidePublic.tsx` (publik guide)

**Ta bort:** "Egenkontroller"-kortet fran features-arrayen

**Lagg till:**
- Tidsrapportering: "Rapportera arbetstid per projekt. Manads- och veckovyer med attestering och periodhantering."
- Fakturor: "Skapa kundfakturor och hantera leverantorsfakturor. Scanna kvitton direkt fran mobilen."
- Kundhantering: "Samla kontaktuppgifter, adresser och anteckningar. Koppla kunder till projekt automatiskt."

---

### 4. `src/components/landing/GuideSection.tsx` (landningssida)

**Uppdatera** `benefits`-listan till mer aktuella punkter:
- "Spara tid pa dokumentation med AI och rost"
- "Skapa professionella offerter och fakturor"
- "Hantera projekt, tid och personal pa ett stalle"

---

### Filer som andras

| Fil | Andring |
|-----|---------|
| `src/pages/Guide.tsx` | Ta bort Ekonomi, lagg till 5 nya sektioner |
| `src/lib/generateGuidePdf.ts` | Fixa svenska tecken, ta bort Ekonomi, lagg till nya sektioner |
| `src/pages/GuidePublic.tsx` | Ta bort Egenkontroller, lagg till 3 nya kort |
| `src/components/landing/GuideSection.tsx` | Uppdatera benefits-lista |

