

## Referenstaggning via plusknappen i ChatInput

### Koncept
Plusknappen i chattfältet blir aktiv och öppnar en snygg popover med tre val: **Kunder**, **Offerter** och **Projekt**. När man väljer en kategori visas en sökruta som söker i databasen i realtid. När man väljer ett objekt "taggas" det som en referenspunkt -- det visas som en liten badge/chip ovanför textfältet och skickas med som kontext till AI:n.

### Användarflöde

1. Användaren trycker på **+** i chattfältet
2. En popover öppnas med tre snygga kort/knappar: Kunder, Offerter, Projekt
3. Användaren trycker på t.ex. "Projekt"
4. Vyn byter till en sökruta med resultat från databasen
5. Användaren söker och väljer ett projekt
6. Popovern stängs, en tagg visas i chattfältet (t.ex. `📌 Badrumsrenovering Strandvägen`)
7. Taggen skickas med som kontext (`selectedProjectId`, `selectedCustomerId` eller `selectedEstimateId`) när nästa meddelande skickas
8. Användaren kan ta bort taggen med ett X

### Tekniska ändringar

#### 1. Ny komponent: `src/components/global-assistant/ReferenceTagPicker.tsx`
En popover-komponent som:
- Visar tre kategori-knappar (Kunder, Offerter, Projekt) med ikoner
- Vid val av kategori byter till sökvy med Input-fält
- Söker i Supabase-tabellerna `customers`, `estimates`, `projects` baserat på vald kategori
- Returnerar valt objekt med typ, id och namn via `onSelect` callback
- Har tillbaka-knapp för att gå tillbaka till kategorivalet

#### 2. Uppdatera `src/components/global-assistant/ChatInput.tsx`
- Ta bort `disabled` från plusknappen
- Lägg till ny prop: `onReferenceSelect: (ref: { type, id, name }) => void`
- Lägg till ny prop: `activeReference?: { type, id, name }` (för att visa taggen)
- Lägg till ny prop: `onReferenceClear: () => void`
- Rendera `ReferenceTagPicker` popover från plusknappen
- Visa en chip/badge ovanför textarea om det finns en aktiv referens

#### 3. Uppdatera `src/pages/GlobalAssistant.tsx`
- Ny state: `activeReference` som håller den taggade referensen
- När meddelande skickas, inkludera referensen i kontexten:
  - Kund -> `selectedCustomerId`
  - Projekt -> `selectedProjectId`
  - Offert -> `selectedEstimateId`
- Skicka `activeReference`, `onReferenceSelect`, `onReferenceClear` till ChatInput

#### 4. Uppdatera `src/components/dashboard/DashboardAssistantWidget.tsx`
- Skicka tomma/noop-handlers för de nya props till ChatInput (dashboarden behöver inte taggning)

### Databasanrop i sökkomponenten
- **Kunder**: `supabase.from('customers').select('id, name, city').ilike('name', '%query%').limit(10)`
- **Projekt**: `supabase.from('projects').select('id, name, address').ilike('name', '%query%').limit(10)`
- **Offerter**: `supabase.from('estimates').select('id, offer_number, manual_project_name, manual_client_name').or('manual_project_name.ilike.%query%, offer_number.ilike.%query%').limit(10)`

### Visuell design
- Popover med `rounded-xl`, `bg-card`, `shadow-lg`, hög `z-index`
- Kategori-knappar som snygga kort med ikon + text (Users, FileText, FolderOpen)
- Sökresultat i en scrollbar lista med namn + detaljer
- Referens-chip med bakgrundsfärg baserad på typ (t.ex. blå för projekt, grön för kund, lila för offert) med X-knapp

### Filändringar

| Fil | Ändring |
|-----|---------|
| `src/components/global-assistant/ReferenceTagPicker.tsx` | Ny komponent |
| `src/components/global-assistant/ChatInput.tsx` | Aktivera +knapp, rendera popover, visa referens-chip |
| `src/pages/GlobalAssistant.tsx` | Ny state + skicka referens som kontext |
| `src/components/dashboard/DashboardAssistantWidget.tsx` | Hantera nya ChatInput-props |

