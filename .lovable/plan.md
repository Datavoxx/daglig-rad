

## Mål

Lägga till en påminnelse ("reminder") efter röstinspelningen för formulär som har Select-komponenter (dropdown/"banderoll") för projekt eller kund. Påminnelsen ska uppmana användaren att välja rätt värde i dropdown-menyn.

---

## Analys av formulär med dropdowns

| Formulär | Dropdown-typ | Behöver påminnelse |
|----------|--------------|-------------------|
| `DailyReportFormCard` | Projekt | ✅ Ja |
| `WorkOrderFormCard` | Projekt | ✅ Ja |
| `TimeFormCard` | Projekt | ✅ Ja |
| `EstimateFormCard` | Kund | ✅ Ja |
| `CustomerFormCard` | Ingen | ❌ Nej |

---

## Lösning

### 1. Utöka `VoiceFormSection` med ny prop

Lägg till en ny prop `requiredSelection` som talar om vilken typ av val som krävs (t.ex. "project" eller "customer").

```typescript
interface VoiceFormSectionProps {
  formType: VoiceFormType;
  onDataExtracted: (data: Record<string, unknown>) => void;
  projectId?: string;
  disabled?: boolean;
  requiredSelection?: "project" | "customer" | "estimate";  // NY
}
```

### 2. Lägg till intern state för att spåra om data har extraherats

```typescript
const [hasExtracted, setHasExtracted] = useState(false);
```

När `onDataExtracted` körs framgångsrikt, sätt `hasExtracted = true`.

### 3. Visa påminnelse efter lyckad extraktion

Efter att formuläret fyllts i, visa en alert/påminnelse med:
- En ikon (t.ex. pekande hand eller pil)
- Text som säger "Glöm inte att välja projekt" eller "Glöm inte att välja kund"

```text
┌─────────────────────────────────────────────────┐
│ ☝️  Glöm inte att välja projekt nedan          │
└─────────────────────────────────────────────────┘
```

### 4. Dölj påminnelsen när valet är gjort

Lägg till en ny prop `selectionMade` som indikerar om användaren redan har valt i dropdown-menyn:

```typescript
requiredSelection?: "project" | "customer" | "estimate";
selectionMade?: boolean;
```

Om `selectionMade` är `true`, visa inte påminnelsen.

---

## Ändringar per fil

### 1. `VoiceFormSection.tsx`

- Lägg till props: `requiredSelection`, `selectionMade`
- Lägg till state: `hasExtracted`
- Uppdatera `handleProcessTranscript` för att sätta `hasExtracted = true`
- Lägg till "completed" state som visar påminnelsen när `hasExtracted && requiredSelection && !selectionMade`

**Ny vy efter lyckad extraktion:**

```text
┌─────────────────────────────────────────────────┐
│  ✓ Formuläret har fyllts i                      │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ ☝️ Glöm inte att välja projekt nedan     │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  [ 🎤 Spela in igen ]                           │
└─────────────────────────────────────────────────┘
```

### 2. `DailyReportFormCard.tsx`

Uppdatera VoiceFormSection-användningen:
```tsx
<VoiceFormSection
  formType="daily-report"
  projectId={projectId || undefined}
  onDataExtracted={handleVoiceData}
  disabled={disabled}
  requiredSelection="project"        // NY
  selectionMade={!!projectId}        // NY
/>
```

### 3. `WorkOrderFormCard.tsx`

```tsx
<VoiceFormSection
  formType="work-order"
  projectId={projectId || undefined}
  onDataExtracted={handleVoiceData}
  disabled={disabled}
  requiredSelection={!preselectedProjectId ? "project" : undefined}
  selectionMade={!!projectId}
/>
```

### 4. `TimeFormCard.tsx`

```tsx
<VoiceFormSection
  formType="time"
  projectId={projectId || undefined}
  onDataExtracted={handleVoiceData}
  disabled={disabled}
  requiredSelection="project"
  selectionMade={!!projectId}
/>
```

### 5. `EstimateFormCard.tsx`

```tsx
<VoiceFormSection
  formType="estimate"
  onDataExtracted={handleVoiceData}
  disabled={disabled}
  requiredSelection="customer"
  selectionMade={!!customerId}
/>
```

### 6. `CustomerFormCard.tsx`

Ingen ändring behövs - formuläret har ingen dropdown.

---

## Påminnelsens design

```text
┌─────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────┐ │
│ │ ☝️  Glöm inte att välja projekt nedan          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│           [ 🎤 Spela in igen ]                      │
└─────────────────────────────────────────────────────┘
```

- Bakgrundsfärg: `bg-amber-50/50` eller `bg-warning/10`
- Ikon: `PointingUp` eller liknande
- Text: Dynamisk baserat på `requiredSelection`

---

## Sammanfattning av filer att ändra

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `src/components/global-assistant/VoiceFormSection.tsx` | Lägg till props, state och "completed" vy med påminnelse |
| 2 | `src/components/global-assistant/DailyReportFormCard.tsx` | Lägg till `requiredSelection="project"` och `selectionMade` |
| 3 | `src/components/global-assistant/WorkOrderFormCard.tsx` | Lägg till conditional `requiredSelection` och `selectionMade` |
| 4 | `src/components/global-assistant/TimeFormCard.tsx` | Lägg till `requiredSelection="project"` och `selectionMade` |
| 5 | `src/components/global-assistant/EstimateFormCard.tsx` | Lägg till `requiredSelection="customer"` och `selectionMade` |

---

## Resultat

1. Efter att röstinspelningen bearbetat och fyllt i formuläret, visas en tydlig påminnelse
2. Påminnelsen säger "Glöm inte att välja projekt nedan" eller "Glöm inte att välja kund nedan"
3. Påminnelsen försvinner automatiskt när användaren valt i dropdown-menyn
4. Användaren kan spela in igen om de vill
5. Konsekvent upplevelse i alla formulär med dropdowns

