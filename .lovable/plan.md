

# Plan: Skapa CheckInFormCard (Personalliggare) i Byggio AI

## Sammanfattning

Du vill att check-in-kortet i chatten ska:
1. Likna Personalliggare-designen med header-ikon och titel
2. Ha etiketten "Checka in (Personalliggare)" istället för bara "Checka in"
3. Visa projektväljare med "Välj arbetsplats"
4. Ha en stor grön "Checka in"-knapp

## Vad som behöver göras

### 1. Skapa ny komponent: CheckInFormCard.tsx

En ny fil som liknar designen i referensbilden:

```text
┌─────────────────────────────────────┐
│ [✓] Personalliggare                 │
│     Elektronisk närvaro enligt...   │
│                                     │
│ Checka in                           │
│                                     │
│ Välj arbetsplats                    │
│ ┌─────────────────────────────┐     │
│ │ Välj projekt...           ▼ │     │
│ └─────────────────────────────┘     │
│                                     │
│ ┌─────────────────────────────┐     │
│ │    ➜  Checka in             │     │
│ └─────────────────────────────┘     │
└─────────────────────────────────────┘
```

Komponenten tar in en lista av projekt och callbacks för submit/cancel.

### 2. Uppdatera types (global-assistant.ts)

Lägg till `check_in_form` i Message type-unionen.

### 3. Uppdatera MessageList.tsx

Importera `CheckInFormCard` och rendera det för `check_in_form` meddelandetyp.

### 4. Uppdatera GlobalAssistant.tsx

Lägg till:
- `handleCheckInFormSubmit` - skickar meddelande till AI:n för att checka in på valt projekt
- `handleCheckInFormCancel` - avbryter incheckning
- Skicka dessa som props till MessageList

## Filer att skapa/ändra

| Fil | Ändring |
|-----|---------|
| `src/components/global-assistant/CheckInFormCard.tsx` | **NY FIL** - Personalliggare-liknande kort med projektväljare |
| `src/types/global-assistant.ts` | Lägg till `check_in_form` i Message type |
| `src/components/global-assistant/MessageList.tsx` | Importera och rendera CheckInFormCard |
| `src/pages/GlobalAssistant.tsx` | Lägg till handleCheckInFormSubmit och handleCheckInFormCancel |

## Tekniska detaljer

**CheckInFormCard props:**
```typescript
interface CheckInFormCardProps {
  projects: Array<{ id: string; name: string; address?: string }>;
  onSubmit: (projectId: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}
```

**handleCheckInFormSubmit:**
```typescript
const handleCheckInFormSubmit = async (projectId: string) => {
  await sendMessage(
    `Checka in på projekt med ID ${projectId}`,
    { selectedProjectId: projectId }
  );
};
```

## Förväntat resultat

| Före | Efter |
|------|-------|
| Kort saknas helt för check-in | Snyggt Personalliggare-kort visas |
| Text "Checka in" utan kontext | Header: "Personalliggare (Elektronisk närvaro)" |
| — | Underrubrik: "Checka in" |
| — | Dropdown: "Välj arbetsplats" |
| — | Grön knapp: "Checka in" |

