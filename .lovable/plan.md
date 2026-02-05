

# Plan: Bokningsformulär med "fake-kalender" för utbildning

## Sammanfattning

Flytta FreeTrainingSection ovanför AIAgentsSection och ersätta "Boka utbildning"-knappen med en dialog som innehåller:
1. Formulär för användaruppgifter (namn, e-post, telefon)
2. Val av utbildningslängd (30 eller 60 min)
3. En kalender-liknande vy för att välja önskad tid att bli uppringd
4. Skicka allt till webhook: `https://datavox.app.n8n.cloud/webhook/utbildning`

---

## Ändringar

### 1. Flytta sektionen i Landing.tsx

**Före:**
```
FeaturesSection
AIAgentsSection  <-- AI-kollegor
IntegrationsSection
HowItWorksSection
FreeTrainingSection  <-- Utbildning (fel plats)
```

**Efter:**
```
FeaturesSection
FreeTrainingSection  <-- Utbildning (NY plats)
AIAgentsSection  <-- AI-kollegor
IntegrationsSection
HowItWorksSection
```

---

### 2. Ny komponent: TrainingBookingDialog

**Fil:** `src/components/landing/TrainingBookingDialog.tsx`

#### Formulärfält:
| Fält | Typ | Obligatoriskt |
|------|-----|---------------|
| Namn | text | Ja |
| E-post | email | Ja |
| Telefon | tel | Ja |
| Utbildningslängd | radio (30/60 min) | Ja |
| Önskad dag | kalenderval | Ja |
| Önskad tid | tidslot-val | Ja |

#### Fake-kalender-design:
- Visa kommande 14 dagar som klickbara kort
- När dag är vald, visa tidslots (09:00, 10:00, 11:00, 13:00, 14:00, 15:00)
- Ser ut och känns som en riktig bokningskalender
- Allt skickas bara till webhook

#### UI-struktur:
```
┌──────────────────────────────────────────────────────┐
│  Boka din gratis utbildning                      [X] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Namn: [________________]                            │
│  E-post: [________________]                          │
│  Telefon: [________________]                         │
│                                                      │
│  Utbildningslängd:                                   │
│  ○ 30 min - Snabbstart                               │
│  ○ 60 min - Djupdykning                              │
│                                                      │
│  Välj dag:                                           │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │Mån │ │Tis │ │Ons │ │Tor │ │Fre │ │Mån │ │Tis │   │
│  │ 5  │ │ 6  │ │ 7  │ │ 8  │ │ 9  │ │ 12 │ │ 13 │   │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘   │
│                                                      │
│  Välj tid:                                           │
│  ┌───────┐ ┌───────┐ ┌───────┐                      │
│  │ 09:00 │ │ 10:00 │ │ 11:00 │                      │
│  └───────┘ └───────┘ └───────┘                      │
│  ┌───────┐ ┌───────┐ ┌───────┐                      │
│  │ 13:00 │ │ 14:00 │ │ 15:00 │                      │
│  └───────┘ └───────┘ └───────┘                      │
│                                                      │
│           [ Boka utbildning → ]                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### 3. Webhook-payload

Data som skickas till `https://datavox.app.n8n.cloud/webhook/utbildning`:

```json
{
  "name": "Anna Andersson",
  "email": "anna@byggfirma.se",
  "phone": "0701234567",
  "training_duration": "60 min",
  "preferred_date": "2026-02-10",
  "preferred_time": "10:00",
  "requested_at": "2026-02-05T16:50:00.000Z"
}
```

---

### 4. Uppdatera FreeTrainingSection

- Ta bort externa cal.com-länken
- Lägg till state för att öppna dialogen
- Importera och rendera TrainingBookingDialog

---

## Tekniska detaljer

- Använder `date-fns` för datumhantering (redan installerat)
- Dialogen använder Radix Dialog (redan finns)
- Formulärvalidering med zod
- Toast-meddelande vid lyckad bokning

---

## Filer som ändras/skapas

| Fil | Ändring |
|-----|---------|
| `src/pages/Landing.tsx` | Flytta FreeTrainingSection ovanför AIAgentsSection |
| `src/components/landing/TrainingBookingDialog.tsx` | NY - Bokningsformulär med fake-kalender |
| `src/components/landing/FreeTrainingSection.tsx` | Integrera dialog istället för extern länk |

