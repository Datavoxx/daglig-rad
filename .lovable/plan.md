

## Plan: Realistiska AI-agentbeskrivningar fokuserade på röstinspelning

### Kärna: Vad agenterna faktiskt gör
Alla tre agenter gör samma sak tekniskt: **tar röstinspelning och strukturerar den till rätt format**. Det eliminerar adminarbete - inte genom att vara "smarta", utan genom att förstå vad du säger och lägga in det rätt.

---

## Ändringar

### Fil 1: `src/components/landing/AIAgentsSection.tsx`

| Agent | Nuvarande | Nytt |
|-------|-----------|------|
| Saga | "hjälper dig med prissättning" | "Du pratar – hon skriver offerten" |
| Bo | "håller koll på projektets alla faser" | "Du beskriver – han ritar tidplanen" |
| Ulla | "skapar arbetsorder automatiskt" | "Du berättar – hon dokumenterar" |

**Rad 8-33 - Ny agents-array:**
```typescript
const agents = [
  {
    slug: "saga",
    name: "Saga",
    title: "Kalkylexpert",
    description: "Du pratar in projektet – Saga skapar offerten. Slipp sitta och skriva varje post manuellt.",
    avatar: sagaAvatar,
    skills: ["Offerter", "Kalkylmallar", "ROT/RUT-beräkning"],
  },
  {
    slug: "bo",
    name: "Bo",
    title: "Projektplanerare", 
    description: "Du beskriver projektet – Bo ritar upp tidplanen. Faser, veckor och parallella arbeten på plats direkt.",
    avatar: boAvatar,
    skills: ["Tidsplaner", "Gantt-schema", "Fasplanering"],
  },
  {
    slug: "ulla",
    name: "Ulla",
    title: "Dokumentationsassistent",
    description: "Du berättar vad som hänt – Ulla skapar rapporten. Dagbok, ÄTA och arbetsorder utan pappersarbete.",
    avatar: ullaAvatar,
    skills: ["Dagrapporter", "ÄTA-hantering", "Arbetsorder"],
  },
];
```

---

### Fil 2: `src/pages/ai/AgentDetail.tsx`

#### Saga (rad 29-52)

**heroDescription:**
```
"Slipp skriva offerter för hand. Prata in vad projektet innehåller – Saga strukturerar poster, mängder och belopp medan du pratar."
```

**fullDescription:**
```
"Saga tar din röstinspelning och gör den till en färdig offert. Du säger 'rivning av kök, 8 timmar á 650 kronor' – hon lägger in det under rätt kategori med rätt beräkning. ROT- och RUT-avdrag beräknas automatiskt. Du får en proffsig offert utan att röra tangentbordet."
```

**Capabilities:**
1. **Röststyrd offert** - "Prata in moment, mängder och priser. Saga lägger in allt i rätt format – du slipper skriva och formatera."
2. **Automatisk kategorisering** (byt från "Smart prissättning") - "Saga förstår att 'rivning' är Bygg och 'måla vägg' är Målning. Du behöver inte sortera manuellt."
3. **Kalkylmallar** - "Spara vanliga projekt som mallar. Nästa gång behöver du bara prata in ändringarna."

**Skills:** ["Offerter", "Kalkylmallar", "ROT/RUT-beräkning", "Artikelbibliotek"]
(Ta bort "Prissättning" - hon prissätter inte, hon tar det du säger)

---

#### Bo (rad 54-77)

**heroDescription:**
```
"Slipp rita tidplaner manuellt. Beskriv projektet med rösten – Bo skapar ett Gantt-schema med faser och tidsuppskattningar."
```

**fullDescription:**
```
"Bo tar din projektbeskrivning och gör den till en visuell tidplan. Du säger 'först rivning i två veckor, sen el och VVS parallellt' – han ritar upp det med rätt faser och veckor. Du får en tidplan att visa kunden utan att sitta och pilla i Excel."
```

**Capabilities:**
1. **Automatisk tidplan** - "Beskriv projektet i stora drag – Bo skapar faser med veckonummer och längd automatiskt."
2. **Gantt-schema** - "Visuell översikt över hela projektet. Se alla faser och hur de ligger i tid."
3. **Parallella faser** (byt från "Resursplanering") - "Bo lägger upp arbeten som kan ske samtidigt sida vid sida i schemat."

**Skills:** ["Tidsplaner", "Gantt-schema", "Fasplanering"]
(Oförändrat - dessa stämmer)

---

#### Ulla (rad 79-103)

**heroDescription:**
```
"Slipp skriva dagrapporter vid datorn. Prata in vad som hänt på bygget – Ulla strukturerar allt medan du kör hem."
```

**fullDescription:**
```
"Ulla tar din röstinspelning från bilen och gör den till en strukturerad rapport. Du säger 'idag var vi fyra snickare, monterade kök och väntade på elcentralen' – hon skapar en dagrapport med bemanning, utfört arbete och avvikelser. ÄTA-underlag på samma sätt."
```

**Capabilities:**
1. **Dagrapporter** - "Berätta vad som hänt idag. Ulla strukturerar bemanning, timmar, utfört arbete och avvikelser."
2. **ÄTA-hantering** - "Nämn ändringar eller tilläggsarbeten – Ulla dokumenterar dem separat med orsak och omfattning."
3. **Arbetsorder** - "Beskriv uppgiften med rösten – Ulla fyller i titel, beskrivning och tilldelning åt dig."

**Skills:** ["Dagrapporter", "ÄTA-hantering", "Arbetsorder"]
(Ta bort "Egenkontroller" om det inte finns implementerat)

---

## CTA-sektionen (rad 241-265)

**Nuvarande rubrik:** "Redo att träffa {agent.name}?"

**Ny rubrik:** "Slipp adminarbetet"

**Ny text:** 
```
"Testa {agent.name} gratis. Prata in ditt första projekt och se hur mycket tid du sparar."
```

**Knappar:**
- Primär: "Testa gratis" (istället för "Skapa konto gratis")
- Sekundär: "Se hur det fungerar" → länka till /#how-it-works

---

## Sammanfattning

| Agent | Vad elimineras | Realistiskt löfte |
|-------|----------------|-------------------|
| Saga | Manuellt offertskrivande | "Du pratar – hon skriver" |
| Bo | Manuell tidplanering | "Du beskriver – han ritar" |
| Ulla | Skriva rapporter vid datorn | "Du berättar – hon dokumenterar" |

### Borttaget (falskt)
- "föreslår priser" 
- "lär sig från tidigare offerter"
- "beroenden och kritiska punkter"
- "Resursplanering"
- "kostnadsuppskattning" för ÄTA

### Tillagt (sant)
- "Automatisk kategorisering" (Saga mappar termer)
- "Parallella faser" (Bo stödjer detta)
- Fokus på röstinspelning genomgående

