

## Fix: Förhindra duplikat-kategorier permanent

### Orsak
Race condition i `useArticleCategories` -- flera komponentinstanser seedar samtidigt.

### Losning

**1. Databasmigrering**
- Rensa befintliga duplikater (behall aldsta per user_id + name)
- Lagg till UNIQUE constraint pa `(user_id, name)` sa databasen sjalv nekar dubbletter

```text
-- Rensa duplikater
DELETE FROM article_categories
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, name) id
  FROM article_categories
  ORDER BY user_id, name, created_at ASC
);

-- Lagg till unik constraint
ALTER TABLE article_categories
ADD CONSTRAINT article_categories_user_id_name_key UNIQUE (user_id, name);
```

**2. Andra seed-logiken i `src/hooks/useArticleCategories.ts`**
- Byt fran `.insert(seeds)` till `.upsert(seeds, { onConflict: 'user_id,name', ignoreDuplicates: true })`
- Aven om flera instanser kor samtidigt ignoreras dubbletter automatiskt pa databasniva

### Filer som andras
- `src/hooks/useArticleCategories.ts` (1 rad: insert -> upsert)
- Ny databasmigrering (rensning + constraint)

### Paverkan
- Noll paverkan pa befintlig funktionalitet
- Alla konton far exakt en kopia per kategori
- Problemet kan aldrig uppsta igen
