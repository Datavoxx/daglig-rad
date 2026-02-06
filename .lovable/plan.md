

# Plan: Automatisk synkronisering av offertrader till artikelbiblioteket

## Mål
När en offert sparas ska alla nya unika artiklar automatiskt läggas till i användarens artikelbibliotek, så att de kan återanvändas i framtida offerter.

---

## Synkroniseringslogik

### Villkor för att synka en rad till biblioteket
En offertrad synkas om:
1. Den har en **beskrivning** (description) som inte är tom
2. Den har ett **à-pris** (unit_price) som är större än 0
3. Det finns **ingen befintlig artikel** med samma namn (case-insensitive match)

### Fält som mappas

| estimate_items | articles |
|----------------|----------|
| description | name |
| (ingen) | description (null) |
| article | article_category |
| unit | unit |
| unit_price | default_price |

---

## Ändringar

### 1. Uppdatera useEstimate.ts - saveMutation

Efter att `estimate_items` har sparats (rad ~498), lägg till logik för att:

```typescript
// Sync new items to article library
const itemsWithDescriptions = state.items.filter(
  item => item.description?.trim() && item.unit_price > 0
);

if (itemsWithDescriptions.length > 0) {
  // Fetch existing articles for this user
  const { data: existingArticles } = await supabase
    .from("articles")
    .select("name")
    .eq("user_id", userData.user.id);

  const existingNames = new Set(
    (existingArticles || []).map(a => a.name.toLowerCase().trim())
  );

  // Find new unique articles
  const newArticles = itemsWithDescriptions
    .filter(item => !existingNames.has(item.description.toLowerCase().trim()))
    .map((item, index) => ({
      user_id: userData.user.id,
      name: item.description.trim(),
      description: null,
      article_category: mapToArticleCategory(item.article),
      unit: item.unit || "st",
      default_price: item.unit_price,
      sort_order: (existingArticles?.length || 0) + index,
    }));

  // Deduplicate within the batch
  const uniqueNewArticles = newArticles.filter((article, index, self) =>
    index === self.findIndex(a => a.name.toLowerCase() === article.name.toLowerCase())
  );

  // Insert new articles (fire-and-forget, don't block save)
  if (uniqueNewArticles.length > 0) {
    supabase.from("articles").insert(uniqueNewArticles);
  }
}
```

### 2. Lägg till mapToArticleCategory-funktion

Mappar offertens "article"-fält till artikelbibliotekets kategorier:

```typescript
function mapToArticleCategory(article: string): string {
  const mapping: Record<string, string> = {
    "Arbete": "Arbete",
    "Bygg": "Bygg",
    "Deponi": "Deponi",
    "Framkörning": "Övrigt",
    "Förbrukning": "Material",
    "Förvaltning": "Övrigt",
    "Markarbete": "Bygg",
    "Maskin": "Maskin",
    "Material": "Material",
    "Målning": "Målning",
    "Snöröjning": "Övrigt",
    "Städ": "Övrigt",
    "Trädgårdsskötsel": "Övrigt",
  };
  return mapping[article] || "Övrigt";
}
```

### 3. Invalidera articles-query efter save

Uppdatera `onSuccess` i saveMutation för att trigga uppdatering av artikellistan:

```typescript
queryClient.invalidateQueries({ queryKey: ["articles"] });
```

---

## Flödesdiagram

```text
┌─────────────────────────────────────┐
│       Användaren sparar offert      │
└────────────────┬────────────────────┘
                 ▼
┌─────────────────────────────────────┐
│   Spara estimate + estimate_items   │
└────────────────┬────────────────────┘
                 ▼
┌─────────────────────────────────────┐
│   Filtrera rader med beskrivning    │
│   och à-pris > 0                    │
└────────────────┬────────────────────┘
                 ▼
┌─────────────────────────────────────┐
│   Hämta befintliga artiklar         │
└────────────────┬────────────────────┘
                 ▼
┌─────────────────────────────────────┐
│   Jämför namn (case-insensitive)    │
│   och filtrera ut nya               │
└────────────────┬────────────────────┘
                 ▼
┌─────────────────────────────────────┐
│   Deduplika inom batchen            │
└────────────────┬────────────────────┘
                 ▼
┌─────────────────────────────────────┐
│   Infoga nya artiklar i biblioteket │
│   (fire-and-forget)                 │
└────────────────┬────────────────────┘
                 ▼
┌─────────────────────────────────────┐
│   Returnera success                 │
└─────────────────────────────────────┘
```

---

## Tekniska detaljer

| Aspekt | Beslut |
|--------|--------|
| Blockerar save? | Nej - fire-and-forget för bättre UX |
| Uppdaterar befintliga? | Nej - endast nya artiklar skapas |
| Matcher på | name (description) case-insensitive |
| Felhantering | Loggar fel men stoppar inte save |

---

## Fil som ändras

| Fil | Ändring |
|-----|---------|
| `src/hooks/useEstimate.ts` | Lägg till synkroniseringslogik efter item-insert |

