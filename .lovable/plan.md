

## Plan: Gör projekt obligatoriskt i leverantörsfakturadialogen

### Nuvarande beteende
- Projektfältet är **valfritt** – användaren kan spara utan att välja projekt
- Labeln visar bara "Projekt" utan asterisk
- Vid spara sätts `project_id: projectId || null`

### Nytt beteende
- Projektfältet blir **obligatoriskt**
- Visuell indikation med asterisk (*) på labeln
- Röd kantlinje om inget projekt är valt när användaren försöker spara
- "Spara ändringar"-knappen blockeras och visar felmeddelande om projekt saknas

---

## Ändringar i VendorInvoiceDialog.tsx

### 1. Lägg till valideringsstate
```tsx
const [projectError, setProjectError] = useState(false);
```

### 2. Uppdatera labeln med asterisk
```tsx
<Label>Projekt *</Label>
```

### 3. Lägg till visuell felindikation på Select
```tsx
<Select value={projectId} onValueChange={(v) => { setProjectId(v); setProjectError(false); }}>
  <SelectTrigger className={projectError ? "border-destructive" : ""}>
    <SelectValue placeholder="Välj projekt" />
  </SelectTrigger>
  ...
</Select>
{projectError && (
  <p className="text-xs text-destructive">Projekt måste väljas</p>
)}
```

### 4. Validera innan spara
Uppdatera form submit-hanteraren:
```tsx
<form onSubmit={(e) => { 
  e.preventDefault(); 
  if (!projectId) {
    setProjectError(true);
    toast.error("Du måste välja ett projekt");
    return;
  }
  saveMutation.mutate(); 
}}>
```

### 5. Ta bort fallback till null i mutation
```tsx
project_id: projectId,  // Inte längre projectId || null
```

---

## Resultat

| Före | Efter |
|------|-------|
| Projekt valfritt | Projekt obligatoriskt |
| Ingen visuell markering | Asterisk (*) på labeln |
| Kan spara utan projekt | Blockeras + felmeddelande |
| `project_id: null` tillåtet | Kräver giltigt projekt-id |

