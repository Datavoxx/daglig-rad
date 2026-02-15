

## Mjukare animation och redigera-knapp for ÄTA

### 1. Mjukare animation på exempel-panelen

Nuvarande implementation använder `animate-accordion-down/up` som kan kännas hackig. Ersätt Collapsible-wrappern med en CSS-baserad `grid-rows`-transition som ger en smidigare effekt.

Ändring i `src/components/projects/ProjectAtaTab.tsx` (rad 465-507):
- Ta bort `Collapsible`/`CollapsibleContent`-wrappern
- Ersätt med en `div` som använder CSS `grid` transition-teknik:
  - Yttre div: `display: grid` med `grid-template-rows: 0fr` (stängd) eller `1fr` (öppen), plus `transition: grid-template-rows 300ms ease-in-out`
  - Inre div: `overflow: hidden; min-height: 0`
- Detta ger en helt smooth höjd-animation utan hack

Importera bort `Collapsible`/`CollapsibleContent` om de inte längre används.

### 2. Redigera-knapp bredvid ta bort-knappen i tabellen

Ändring i `src/components/projects/ProjectAtaTab.tsx` (rad 686 och rad 819-828):
- Ändra sista `TableHead` kolumnen från `w-10` till `w-20` för att ge plats åt två knappar
- I `TableCell` (rad 819-828): Lägg till en `Pencil`-knapp (edit) bredvid `Trash2`-knappen
- Redigera-knappen öppnar dialogen med den valda ÄTA:ns data förifylld

Ny logik behövs:
- En `editingAta` state (`Ata | null`) som håller reda på vilken ÄTA som redigeras
- En `openEditAta(ata)` funktion som fyller i formuläret från befintlig ÄTA-data och öppnar dialogen
- Uppdatera `handleSubmit` för att göra en `update` istället för `insert` om `editingAta` finns
- Uppdatera `closeDialog` för att nollställa `editingAta`
- Dialog-titeln ändras till "Redigera ÄTA" vid redigering

### Tekniska detaljer

**Ny state:**
```
const [editingAta, setEditingAta] = useState<Ata | null>(null);
```

**openEditAta-funktion:**
Fyller `formRows` med en rad baserad på ÄTA:ns data, sätter `formReason`, `formStatus`, och öppnar dialogen.

**handleSubmit-ändring:**
Om `editingAta` finns, kör `supabase.from("project_ata").update(...)` istället for `insert`.

**Tabellknapp:**
```tsx
<div className="flex items-center gap-0.5">
  <Button variant="ghost" size="icon" onClick={() => openEditAta(ata)}>
    <Pencil className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="icon" onClick={() => handleDelete(ata.id)}>
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```
