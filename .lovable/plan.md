

## Lagg till "Skapa ny artikel" i Artikelbiblioteket

### Vad andras

En knapp **"+ Ny artikel"** laggs till i `ArticleLibrarySection.tsx` sa att man kan skapa nya artiklar direkt fran offertsidan, utan att behova ga till installningar.

### Hur det fungerar

- En liten dialog (samma stil som i ArticleManager) oppnas med falt for: Namn, Beskrivning, Kategori (dynamisk fran `useArticleCategories`), Enhet och Standardpris
- Nar man sparar laggs artikeln till i databasen och listan uppdateras direkt
- Knappen placeras bredvid sokfaltet eller i headern pa kortet
- Panelen visas aven nar det inte finns nagra artiklar annu (idag doljs den helt med `return null`)

### Fil som andras

| Fil | Andring |
|-----|---------|
| `src/components/estimates/ArticleLibrarySection.tsx` | Lagg till create-dialog, "Ny artikel"-knapp, importera `useArticleCategories`, visa panelen aven vid 0 artiklar |

### Teknisk detalj

- Ateranvander samma formular-logik som finns i `ArticleManager.tsx` (Dialog med namn, beskrivning, kategori, enhet, pris)
- Anvander `useArticleCategories` for dynamiska kategorier i dropdown
- Efter sparande kallas `fetchArticles()` for att uppdatera listan
- Panelen visas alltid (tar bort `if (articles.length === 0) return null`) sa att nya anvandare kan skapa sin forsta artikel direkt fran offerten

