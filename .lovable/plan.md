

## Mål

Lägg till en "Ny kund"-knapp i offertformuläret som automatiskt skickar meddelandet "Jag vill skapa en ny kund" till assistenten.

---

## Visuell förändring

```text
Nuvarande design:
┌─────────────────────────────────────────┐
│  Kund                                   │
│  ┌───────────────────────────────────┐  │
│  │ Välj kund...              ▼       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

Ny design:
┌─────────────────────────────────────────┐
│  Kund                                   │
│  ┌─────────────────────────┐  ┌──────┐  │
│  │ Välj kund...        ▼   │  │+ Ny  │  │
│  └─────────────────────────┘  └──────┘  │
└─────────────────────────────────────────┘
```

---

## Teknisk implementation

### Fil: `src/components/global-assistant/EstimateFormCard.tsx`

**1. Lägg till ny prop för att hantera "Ny kund"-klick:**

```tsx
interface EstimateFormCardProps {
  customers: Customer[];
  onSubmit: (data: EstimateFormData) => void;
  onCancel: () => void;
  onCreateNewCustomer?: () => void;  // NY PROP
  disabled?: boolean;
}
```

**2. Uppdatera komponentens destrukturering:**

```tsx
export function EstimateFormCard({
  customers,
  onSubmit,
  onCancel,
  onCreateNewCustomer,  // NY
  disabled,
}: EstimateFormCardProps) {
```

**3. Uppdatera kund-selector layouten (rad 89-106):**

```tsx
{/* Customer selector */}
<div className="space-y-1.5">
  <Label htmlFor="customer" className="text-xs text-muted-foreground">
    Kund
  </Label>
  <div className="flex gap-2">
    <Select value={customerId} onValueChange={setCustomerId} disabled={disabled}>
      <SelectTrigger id="customer" className="flex-1">
        <SelectValue placeholder="Välj kund..." />
      </SelectTrigger>
      <SelectContent>
        {customers.map((customer) => (
          <SelectItem key={customer.id} value={customer.id}>
            {customer.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {onCreateNewCustomer && (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCreateNewCustomer}
        disabled={disabled}
        className="shrink-0"
      >
        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
        Ny kund
      </Button>
    )}
  </div>
</div>
```

**4. Lägg till import för UserPlus-ikonen:**

```tsx
import { FileText, X, UserPlus } from "lucide-react";
```

---

### Fil: `src/components/global-assistant/MessageList.tsx`

**Skicka in callback till EstimateFormCard:**

Hitta där `EstimateFormCard` renderas och lägg till:

```tsx
<EstimateFormCard
  customers={...}
  onSubmit={...}
  onCancel={...}
  onCreateNewCustomer={() => onSendMessage?.("Jag vill skapa en ny kund")}
  disabled={...}
/>
```

---

## Sammanfattning

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `EstimateFormCard.tsx` | Lägg till `onCreateNewCustomer` prop |
| 2 | `EstimateFormCard.tsx` | Lägg till "Ny kund"-knapp bredvid kundväljaren |
| 3 | `EstimateFormCard.tsx` | Importera `UserPlus`-ikon |
| 4 | `MessageList.tsx` | Skicka callback som triggar "Jag vill skapa en ny kund" |

---

## Resultat

- En "Ny kund"-knapp visas bredvid kundväljaren i offertformuläret
- När användaren klickar på knappen skickas meddelandet "Jag vill skapa en ny kund" automatiskt
- Assistenten startar då kundflödet

