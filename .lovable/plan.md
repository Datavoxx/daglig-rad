

## Dynamiska artikelkategorier

### Oversikt

Idag ar kategorierna (Material, Arbete, Bygg, Maskin osv.) hardkodade i koden. Du vill kunna skapa egna kategorier och se dem i en separat panel **"Artikelkategorier"** bredvid **"Artikelbibliotek"** inne pa offertsidan.

### Steg 1: Ny databastabell

Skapa en tabell `article_categories` som sparar anvandarens egna kategorier:

- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `name` (text, NOT NULL) -- t.ex. "Plattsattning", "El"
- `type` (text) -- "labor", "material", eller "subcontractor" (for korrekt finansiell mappning)
- `sort_order` (integer)
- `is_active` (boolean, default true)
- `created_at` / `updated_at`

RLS: Anvandare ser/hanterar bara sina egna kategorier. Vid forsta inloggningen seedas standardkategorierna (Arbete, Material, Bygg osv.) sa att anvandaren startar med en basuppsattning.

### Steg 2: Ny komponent -- ArticleCategorySection

En ny panel liknande `ArticleLibrarySection` men for kategorier:

- Visa alla kategorier i en lista (namn + typ-badge)
- Knapp for att lagga till ny kategori (inline eller liten dialog)
- Redigera/ta bort befintliga kategorier
- Placeras bredvid Artikelbiblioteket i `EstimateBuilder.tsx`

### Steg 3: Ersatt hardkodade kategorier

Overallt dar `ARTICLE_CATEGORIES` eller liknande listor anvands idag byter vi till att hamta fran databasen:

| Fil | Andring |
|-----|---------|
| `EstimateTable.tsx` | Byt hardkodad `ARTICLE_CATEGORIES` mot dynamisk lista fran `article_categories`-tabellen |
| `ArticleManager.tsx` | Byt hardkodad `ARTICLE_CATEGORIES` mot dynamisk lista |
| `ArticleLibrarySection.tsx` | Ingen andring behovs (lasser redan `article_category` fran articles-tabellen) |
| `EstimateBuilder.tsx` | Lagg till `ArticleCategorySection` bredvid `ArticleLibrarySection` |

### Steg 4: Seed-funktion

Nar en anvandare inte har nagra kategorier annu skapas standardkategorierna automatiskt vid forsta laddningen (13 st fran den befintliga listan: Arbete, Bygg, Deponi, Material osv.).

### Layout i EstimateBuilder

```text
+---------------------------+---------------------------+
|   Artikelkategorier       |   Artikelbibliotek        |
|   [+ Ny kategori]         |   [Sok artiklar...]       |
|                           |                           |
|   Arbete (Arbete)         |   Gipsplatta 13mm  150kr  |
|   Material (Material)     |   Spackel         89kr    |
|   El (Arbete)             |   ...                     |
|   ...                     |                           |
+---------------------------+---------------------------+
```

### Filer som skapas/andras

| Fil | Typ |
|-----|-----|
| `article_categories` (databastabell) | Ny |
| `src/components/estimates/ArticleCategorySection.tsx` | Ny |
| `src/components/estimates/EstimateBuilder.tsx` | Andras -- lagg till ny komponent |
| `src/components/estimates/EstimateTable.tsx` | Andras -- dynamiska kategorier |
| `src/components/settings/ArticleManager.tsx` | Andras -- dynamiska kategorier |

