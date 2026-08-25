# Fem förbättringar: Docs-mappar, bilder, duplicera offert, artikelbibliotek, tidsplan

## 1. Mappar i Docs
- Ny tabell `document_folders` (namn, user_id) plus kolumnen `folder_id` på `documents`.
- Docs-listan får en vänsterkolumn med mappar: "Alla dokument" + egna mappar, med skapa/byt namn/ta bort.
- Dokument kan flyttas till en mapp via en meny på dokumentkortet. Dokument utan mapp ligger kvar under "Alla dokument".

## 2. Infoga bilder i Docs
- Bilduppladdning i editorn: knapp i verktygsfältet samt drag-and-drop/klistra in.
- Bilder lagras i en egen lagringsplats för dokumentbilder och infogas som bild i texten.
- Bilder skalas till sidbredden och följer med i PDF-exporten.

## 3. Duplicera offert
- Ny åtgärd "Duplicera" i offertlistans meny (både desktop och mobil).
- Kopierar offertens alla fält, rader, tillägg och villkor till en ny offert med status utkast, nytt offertnummer och titel med "(kopia)".

## 4. Artikelbibliotek: ändra och ta bort
- Artikelbiblioteket får samma hantering som artikelkategorier redan har: penna för att redigera (namn, enhet, pris, kategori) och papperskorg för att ta bort, med bekräftelse.
- Ändringar sparas direkt mot artikelregistret och listan uppdateras.

## 5. Ta bort Tidsplan
- Kortet "Tidsplan" tas bort från offertbyggaren.
- Tidsplansfältet tas även bort ur offertens förhandsvisning och PDF så inget tomt avsnitt blir kvar.

## Tekniska detaljer
- Databas: migration för `document_folders` (RLS + GRANT, `auth.uid() = user_id`) och `documents.folder_id` (nullable, on delete set null). Ny publik lagringsplats `doc-images` med RLS per användarmapp.
- Frontend: `src/pages/Docs.tsx` (mapplista/filter/flytta), `src/pages/DocView.tsx` + `src/components/docs/DocEditorToolbar.tsx` (TipTap `Image`-extension, uppladdning), `src/lib/exportDocToPdf.ts` (bildstöd).
- Offert: duplicering i `src/pages/Estimates.tsx` (insert av `project_estimates` + `estimate_items` + `estimate_addons`); tidsplan tas bort i `EstimateBuilder.tsx`, `QuoteLivePreview.tsx`, `QuotePreviewSheet.tsx` och `generateQuotePdf.ts`.
- Artiklar: redigerings-/raderingsflöde i `src/components/estimates/ArticleLibrarySection.tsx` mot tabellen `articles`.
