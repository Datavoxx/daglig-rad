
## Plan: Ny datamigrerings-sektion med 3D-animerad flödesvisualisering

### Översikt
Ersätt det nuvarande Excel-integrationskortet med en visuell "datamigreringsflödes"-komponent som visar hur användare kan flytta data från externa system till Byggio. Dessutom uppdateras texten för planering i FeaturesSection.

---

### DEL 1: Ny DataMigrationFlow-komponent

**Ny fil: `src/components/landing/DataMigrationFlow.tsx`**

En animerad 3D-visualisering som visar flödet:

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    [Externt System]  ──→  [Excel-fil]  ──→  [Byggio]           │
│         📊                   📄                🏗️              │
│       (grå box)           (grön ikon)      (primary färg)       │
│                                                                 │
│    Animerade pilar som pulserar i flödesriktningen              │
│    + "data-partiklar" som rör sig längs pilarna                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Animationsdetaljer:**
- Tre kort/boxar i rad med 3D-tilt-effekt (återanvänd TiltCard-logiken)
- Animerade streckade linjer mellan boxarna med pulsande glow
- Små "data-prickar" som rör sig från vänster till höger längs pilarna
- Hover-effekter på varje steg
- Responsiv layout (horisontell på desktop, vertikal på mobil)

**Steg-innehåll:**
1. **Externt system** - Ikon: `Database` eller `Server`, text: "Ditt nuvarande system"
2. **Exportera till Excel** - Excel-loggan + text: "Exportera data"
3. **Importera till Byggio** - Byggio-logga/ikon + text: "Importera enkelt"

**Under flödesdiagrammet:**
Lista vad som kan importeras:
- Kunder
- Offerter  
- Projekt

---

### DEL 2: Uppdatera IntegrationsSection

**Fil: `src/components/landing/IntegrationsSection.tsx`**

**Ändringar:**
1. Ta bort hela "Available now - Excel Import" sektionen (rad 20-56)
2. Ta bort Excel-logga importen
3. Lägg till den nya `DataMigrationFlow`-komponenten istället
4. Uppdatera rubrik och undertext:
   - Rubrik: "Flytta din data enkelt" 
   - Undertext: "Har du ett befintligt system? Exportera din data och importera den till Byggio på några minuter"

**Ny struktur:**

```tsx
<section>
  {/* Header */}
  <h2>Flytta din data enkelt</h2>
  <p>Har du ett befintligt system? Exportera din data och importera den till Byggio på några minuter</p>

  {/* Data Migration Flow - NY KOMPONENT */}
  <DataMigrationFlow />

  {/* Kommande integrationer */}
  <Badge>Kommande</Badge>
  <div className="grid md:grid-cols-2">
    {/* Fortnox */}
    {/* Visma */}
  </div>
</section>
```

---

### DEL 3: Uppdatera FeaturesSection - Planeringstext

**Fil: `src/components/landing/FeaturesSection.tsx`**

**Ändra rad 123-124:**

```tsx
// FÖRE:
{
  title: "Tidsplaner som du faktiskt använder",
  description: "Dra och släpp faser. Dela med kunden. Uppdatera på sekunder – direkt från mobilen.",
  mockup: PlanningMockup,
}

// EFTER:
{
  title: "Tidsplaner som du faktiskt använder", 
  description: "Se hela projektet visuellt. Dela planeringen med kunden och håll alla uppdaterade.",
  mockup: PlanningMockup,
}
```

---

### DEL 4: Tailwind-animationer för dataflödet

**Fil: `tailwind.config.ts`**

Lägg till nya keyframes och animationer:

```ts
keyframes: {
  // ... befintliga
  "flow-pulse": {
    "0%, 100%": { opacity: "0.4" },
    "50%": { opacity: "1" },
  },
  "data-particle": {
    "0%": { transform: "translateX(0)", opacity: "0" },
    "10%": { opacity: "1" },
    "90%": { opacity: "1" },
    "100%": { transform: "translateX(100%)", opacity: "0" },
  },
  "float": {
    "0%, 100%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-6px)" },
  },
}

animation: {
  // ... befintliga
  "flow-pulse": "flow-pulse 2s ease-in-out infinite",
  "data-particle": "data-particle 2s ease-in-out infinite",
  "float": "float 3s ease-in-out infinite",
}
```

---

### Sammanfattning

| Fil | Ändring |
|-----|---------|
| `DataMigrationFlow.tsx` | **NY** - Animerad 3D-flödesvisualisering |
| `IntegrationsSection.tsx` | Ersätt Excel-kort med DataMigrationFlow, uppdatera rubriker |
| `FeaturesSection.tsx` | Ändra planeringstexten (ta bort "dra och släpp") |
| `tailwind.config.ts` | Lägg till nya animationer för dataflödet |

---

### Teknisk implementation av DataMigrationFlow

Komponenten använder:
- CSS-animationer för pulsande pilar och flytande data-partiklar
- Flexbox/Grid för responsiv layout
- 3D transform för hover-effekter (liknande TiltCard)
- Lucide-ikoner: `Database`, `FileSpreadsheet`, `Building2` eller liknande
- Excel-loggan (`src/assets/excel-logo.png`) för mellansteget
