

## Mål

Göra Byggio AI mer *konverserande* och kontextmedveten så att den kan:
1. Svara på öppna frågor som "Hur går det för projektet?"
2. Ge sammanfattande insikter med flera datapunkter
3. Fixa intent-detection för "ekonomi för X" → direkt anropa `get_project_economy`

---

## Analys

### Nuvarande problem

| Scenario | Förväntat | Faktiskt resultat |
|----------|-----------|-------------------|
| "ekonomi för tony-test" | `get_project_economy` med ekonomisk översikt | `search_projects` → visar projekt-kort |
| "hur går det för projektet?" | Sammanfattning med flera datapunkter | Troligen bara `get_project` |

### Orsaker

1. **Prompt-missförstånd**: AI:n tolkar "sök X först" som ett separat steg
2. **Brevity-regeln**: "MAX 1-2 meningar" hindrar djupare svar
3. **Inget verktyg för helhetsöversikt**: Det saknas ett verktyg som hämtar projekt + ekonomi + dagrapporter + ÄTA på en gång

---

## Lösning

### 1. Fixa "ekonomi för X" → Direkt till `get_project_economy`

Uppdatera prompten för att tydliggöra att backend resolver projektnamn automatiskt:

```text
<auto_resolve>
VIKTIGT: Backend konverterar automatiskt projektnamn till UUID!

När du kör get_project_economy, get_project, etc. med ett NAMN:
→ Backend hittar rätt projekt automatiskt
→ Du behöver INTE köra search_projects först!

Exempel:
- "ekonomi för Tony Test" → get_project_economy(project_id: "Tony Test") ✅
- "visa projekt Solvik" → get_project(project_id: "Solvik") ✅
</auto_resolve>
```

### 2. Lägg till nytt verktyg: `get_project_overview`

Ett verktyg som hämtar en komplett översikt för konverserande svar:

```typescript
{
  name: "get_project_overview",
  description: "Hämta komplett projektöversikt för att svara på öppna frågor som 'hur går projektet?'. Returnerar ekonomi, dagrapporter, ÄTA, tidsplan och vad som saknas.",
  parameters: {
    project_id: { type: "string", description: "Project ID or name" },
  },
}
```

**Returnerar:**
- Grunddata (namn, status, adress, startdatum)
- Ekonomi (budget, offert, fakturerat, betalat)
- Dagrapporter (antal, senaste, totala timmar)
- ÄTA (godkända, väntande, belopp)
- Tidsplan (faser, nuvarande fas)
- **Varningar** (startdatum saknas, ingen tidsplan, etc.)

### 3. Uppdatera prompt med "Conversational Mode"

```text
<conversational_mode>
ÖPPNA FRÅGOR - svara mer utförligt:

När användaren frågar:
- "hur går det för X?" → get_project_overview → ge sammanfattning
- "berätta om projektet" → get_project_overview → ge sammanfattning
- "vad har hänt på X?" → get_project_overview → fokusera på aktivitet

Sammanfattning ska innehålla:
1. Nuvarande status i en mening
2. Ekonomisk situation (fakturerat vs offert)
3. Aktivitet (dagrapporter, timmar)
4. Eventuella varningar (saknas startdatum, etc.)
5. ÄTA om det finns

Exempel på svar:
"Tony Test är pågående. Ni har fakturerat 45% av offerten (180 000 av 400 000 kr). 
3 dagrapporter senaste veckan, totalt 120 timmar registrerade. 
2 godkända ÄTA (+25 000 kr). Startdatum saknas."
</conversational_mode>
```

### 4. Justerad brevity-regel

```text
<brevity>
SVARSSTIL baserat på frågetyp:

KOMMANDON (skapa, registrera, checka in):
- MAX 1-2 meningar
- Visa formulär DIREKT

ÖPPNA FRÅGOR (hur går det, berätta om, vad har hänt):
- 3-5 meningar OK
- Ge kontext och insikt
- Nämn varningar om något saknas
</brevity>
```

---

## Tekniska ändringar

### 1. Nytt verktyg `get_project_overview`

**Exekvering** (i `executeTool`):

```typescript
case "get_project_overview": {
  const { project_id } = args;
  
  // Hämta projekt
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", project_id)
    .single();
  
  // Hämta ekonomi (återanvänd get_project_economy logik)
  const economy = await getProjectEconomy(project_id);
  
  // Hämta dagrapporter
  const { data: reports } = await supabase
    .from("daily_reports")
    .select("id, report_date, total_hours")
    .eq("project_id", project_id)
    .order("report_date", { ascending: false })
    .limit(5);
  
  // Hämta ÄTA
  const { data: ata } = await supabase
    .from("project_ata")
    .select("*")
    .eq("project_id", project_id);
  
  // Hämta tidsplan
  const { data: plan } = await supabase
    .from("project_plans")
    .select("*")
    .eq("project_id", project_id)
    .single();
  
  // Generera varningar
  const warnings = [];
  if (!project.start_date) warnings.push("Startdatum saknas");
  if (!plan) warnings.push("Ingen tidsplan");
  if (economy.invoiced_amount === 0) warnings.push("Inget fakturerat ännu");
  
  return {
    project,
    economy,
    reports: reports || [],
    reports_count: reports?.length || 0,
    ata: ata || [],
    ata_summary: {
      approved: ata?.filter(a => a.status === 'approved').length || 0,
      pending: ata?.filter(a => a.status === 'pending').length || 0,
      total_value: ata?.reduce((sum, a) => sum + (a.estimated_cost || 0), 0) || 0,
    },
    plan,
    warnings,
  };
}
```

**Formatering** (i `formatToolResults`):

```typescript
case "get_project_overview": {
  const { project, economy, reports_count, ata_summary, warnings } = results;
  
  // Skapa en sammanfattande text
  let summary = `**${project.name}** är ${translateStatus(project.status)}.`;
  
  // Ekonomi
  if (economy.estimate_total > 0) {
    const pct = Math.round((economy.invoiced_amount / economy.estimate_total) * 100);
    summary += ` Fakturerat ${pct}% av offerten (${formatCurrency(economy.invoiced_amount)} av ${formatCurrency(economy.estimate_total)}).`;
  }
  
  // Aktivitet
  summary += ` ${reports_count} dagrapporter, ${economy.total_hours} timmar registrerade.`;
  
  // ÄTA
  if (ata_summary.approved > 0 || ata_summary.pending > 0) {
    summary += ` ${ata_summary.approved} godkända ÄTA (+${formatCurrency(ata_summary.total_value)}).`;
  }
  
  // Varningar
  if (warnings.length > 0) {
    summary += ` ⚠️ ${warnings.join(", ")}.`;
  }
  
  return {
    type: "project_overview",
    content: summary,
    data: { project, economy, ata_summary, warnings },
  };
}
```

---

## Filer att ändra

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `supabase/functions/global-assistant/index.ts` | Lägg till `get_project_overview` verktyg |
| 2 | `supabase/functions/global-assistant/index.ts` | Uppdatera system-prompten med `<auto_resolve>` och `<conversational_mode>` |
| 3 | `supabase/functions/global-assistant/index.ts` | Lägg till execute-logik för `get_project_overview` |
| 4 | `supabase/functions/global-assistant/index.ts` | Lägg till format-logik för `get_project_overview` |

---

## Resultat

1. **"ekonomi för tony-test"** → AI kör `get_project_economy` direkt (inte `search_projects`)
2. **"hur går det för projektet?"** → AI ger sammanfattning med ekonomi, aktivitet, ÄTA och varningar
3. Formulär visas fortfarande direkt för kommandon
4. Öppna frågor får mer utförliga, kontextrika svar

---

## Exempel på nytt beteende

**Användare:** "hur går det för tony-test?"

**Byggio AI:**
> **tony-test** är pågående. Fakturerat 45% av offerten (180 000 av 400 000 kr). 
> 3 dagrapporter senaste veckan, 120 timmar registrerade. 
> 2 godkända ÄTA (+25 000 kr). 
> ⚠️ Startdatum saknas.

