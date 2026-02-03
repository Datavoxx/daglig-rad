
## Plan: Ändra redirect efter sparad dagrapport

### Problem
När man sparar en dagrapport från projektvyn (`/projects/{id}`) navigeras man till `/reports/{reportId}` istället för att stanna kvar på projektsidans dagbok-flik.

### Lösning
Ändra `handleReportSaved` i `ProjectDiaryTab.tsx` så att den **inte** navigerar bort, utan bara:
1. Stänger skapandeformuläret
2. Uppdaterar listan med rapporter
3. Visar ett bekräftelsemeddelande

---

## Ändringar

### Fil: `src/components/projects/ProjectDiaryTab.tsx`

**Rad 108-112 - Nuvarande kod:**
```typescript
const handleReportSaved = (reportId: string) => {
  setShowCreateForm(false);
  fetchReports();
  navigate(`/reports/${reportId}`);
};
```

**Ny kod:**
```typescript
const handleReportSaved = (reportId: string) => {
  setShowCreateForm(false);
  fetchReports();
  toast.success("Dagrapport sparad");
  // Stanna kvar på projektsidan - ingen navigering
};
```

---

## Resultat

| Före | Efter |
|------|-------|
| Navigeras till `/reports/{id}` | Stannar på `/projects/{id}` (dagbok-fliken) |
| Förlorar projektkontext | Ser rapporten direkt i listan |
| Måste klicka tillbaka | Kan skapa flera rapporter i rad |

---

## Tekniska detaljer

- `reportId` skickas fortfarande in som parameter men används inte för navigering
- `fetchReports()` körs för att uppdatera listan så den nya rapporten syns direkt
- `toast.success()` ger feedback att sparningen lyckades
- Användaren kan fortfarande klicka på en rapport i listan om de vill se detaljer
