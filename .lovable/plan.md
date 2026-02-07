

## Mål

Fixa så att artikeln som väljs i Byggio AI-chatten (t.ex. "Arbete") sparas korrekt och visas i offerten.

---

## Rotorsak

Det finns en **mismatch mellan värden**:

| Plats | article-värde |
|-------|---------------|
| Chat-formulär (EstimateItemsFormCard) | `"labor"`, `"material"`, `"subcontractor"`, `"other"` |
| Offert-byggare (EstimateTable) | `"Arbete"`, `"Bygg"`, `"Material"`, `"Deponi"` osv |
| Databas | Tillåter båda, men UI visar fel |

**Resultat**: När man väljer "Arbete" i chatten sparas `"labor"` → I offerten visas inget (matchar inte listan)

---

## Lösning: Synkronisera artikelkategorierna

Vi gör så att **samma artikelkategorier** används överallt:

1. **Uppdatera chat-formuläret** att använda de svenska kategorierna (`"Arbete"`, `"Material"`, etc)
2. **Lägg till alla saknade kategorier** i chat-formuläret
3. **Säkerställ** att backend sparar exakt det värde som skickas (inget mapping-behov)

---

## Ändringar

### 1. EstimateItemsFormCard.tsx (Chat-formulär)

Ersätt nuvarande `ARTICLE_TYPES`:

**Från:**
```typescript
const ARTICLE_TYPES = [
  { value: "labor", label: "Arbete" },
  { value: "material", label: "Material" },
  { value: "subcontractor", label: "Underentreprenör" },
  { value: "other", label: "Övrigt" },
];
```

**Till:**
```typescript
const ARTICLE_OPTIONS = [
  "Arbete",
  "Bygg", 
  "Deponi",
  "Framkörning",
  "Förbrukning",
  "Förvaltning",
  "Markarbete",
  "Maskin",
  "Material",
  "Målning",
  "Snöröjning",
  "Städ",
  "Trädgårdsskötsel",
];
```

Uppdatera Select-komponenten att använda samma värde för `value` och visning.

### 2. Backend: add_estimate_items (global-assistant/index.ts)

Uppdatera mappningen så att `type` sätts baserat på den svenska kategorin:

```typescript
const itemsToInsert = items.map((item) => {
  // Mappa svensk kategori till typ
  const articleLower = (item.article || "").toLowerCase();
  let type = "labor";
  if (["material", "bygg", "förbrukning", "maskin"].includes(articleLower)) {
    type = "material";
  } else if (["ue", "underentreprenör"].includes(articleLower)) {
    type = "subcontractor";
  }

  return {
    estimate_id,
    article: item.article,  // Behåll det svenska namnet
    description: item.description || "",
    quantity: item.quantity || 1,
    hours: item.quantity || 1,  // Sätt hours också för att fixa antal-visning
    unit: item.unit || "st",
    unit_price: item.unit_price || 0,
    subtotal: (item.quantity || 1) * (item.unit_price || 0),
    type,  // Beräknad typ
    moment: item.description || "Arbete",
    sort_order: sortOrder++,
  };
});
```

### 3. Standardvärde

Ändra default-artikel i chat-formuläret från `"labor"` till `"Arbete"`:

```typescript
const [items, setItems] = useState<EstimateItem[]>([
  {
    id: crypto.randomUUID(),
    article: "Arbete",  // Svenska istället för engelska
    description: "",
    quantity: null,
    unit: "tim",
    unit_price: 0,
  },
]);
```

---

## Tekniska detaljer

### Mappning artikel → type

| Artikel | type |
|---------|------|
| Arbete | labor |
| Bygg | material |
| Deponi | material |
| Framkörning | labor |
| Förbrukning | material |
| Förvaltning | labor |
| Markarbete | labor |
| Maskin | material |
| Material | material |
| Målning | labor |
| Snöröjning | labor |
| Städ | labor |
| Trädgårdsskötsel | labor |

### Fält som sätts vid insert

- `article`: Det svenska kategorivärdet (visas i offerten)
- `type`: Beräknad typ för summering (labor/material/subcontractor)
- `hours` + `quantity`: Båda sätts till samma värde → Antal visas korrekt

---

## Filer att ändra

1. `src/components/global-assistant/EstimateItemsFormCard.tsx`
   - Ersätt `ARTICLE_TYPES` med `ARTICLE_OPTIONS` (13 kategorier)
   - Uppdatera Select-komponenten
   - Ändra default-värde till `"Arbete"`

2. `supabase/functions/global-assistant/index.ts`
   - Uppdatera `add_estimate_items` för att mappa artikel → type
   - Sätt `hours` = `quantity` för att fixa antal-display

---

## Resultat

- Alla 13 artikelkategorier finns i chat-formuläret
- Vald artikel (t.ex. "Arbete") sparas och syns i offerten
- Antal visas korrekt eftersom både `hours` och `quantity` sätts
- Befintlig kod i offertbyggaren behöver inte ändras

