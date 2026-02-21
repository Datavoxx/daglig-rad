
## Lägg till kategori-väljare för kvitton (Material / Lunch)

### Vad ändras
Efter att AI har extraherat ett kvitto visas en ny "Kategori"-väljare bredvid projekt-väljaren. Användaren väljer mellan **Material** och **Lunch**. Kategorin sparas i databasen och visas i kvittolistan.

### Steg

1. **Databasmigrering** -- Lägg till kolumn `category` (text, nullable, default null) i tabellen `receipts`.

2. **`src/components/invoices/ReceiptUploadDialog.tsx`**
   - Lägg till state `category` (default `""`)
   - Lägg till en `Select`-komponent under projekt-väljaren med label "Kategori" och två alternativ: "Material" och "Lunch"
   - Skicka `category` vid insert till `receipts`-tabellen
   - Nollställ `category` i `handleClose`

3. **`src/components/invoices/ReceiptList.tsx`**
   - Visa kategori-badge på varje kvittokort (t.ex. "Material" eller "Lunch")
   - Eventuellt lägga till kategori som filteralternativ

4. **`src/components/invoices/ReceiptDetailDialog.tsx`**
   - Visa kategorin i detaljvyn

### Tekniska detaljer

**SQL-migrering:**
```sql
ALTER TABLE receipts ADD COLUMN category text;
```

**ReceiptUploadDialog -- ny state + UI (efter projekt-väljaren, rad ~334):**
```tsx
const [category, setCategory] = useState<string>("");

// I JSX, efter projekt-selector:
<div className="space-y-2">
  <Label className="text-sm font-medium">Kategori</Label>
  <Select value={category} onValueChange={setCategory}>
    <SelectTrigger>
      <SelectValue placeholder="Välj kategori" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="material">Material</SelectItem>
      <SelectItem value="lunch">Lunch</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Insert-anropet utökas med:**
```tsx
category: category || null,
```

**handleClose nollställer:**
```tsx
setCategory("");
```

Tre filer ändras + en databasmigrering.
