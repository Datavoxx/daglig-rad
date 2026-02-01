

## Fixa QR-kod redirect till produktions-URL

### Problemet

QR-koden genererar en länk med `window.location.origin` (rad 80-81), vilket ger:
- Preview: `https://id-preview--ac9bbaf4-b5d3-48f1-aeda-76b5b137d4d4.lovable.app/attendance/scan/...`
- Ska vara: `https://daglig-rad.lovable.app/attendance/scan/...`

När någon scannar QR-koden via en e-postklient eller mobil, kan Lovable's preview-URL orsaka redirects som gör att användaren aldrig kommer till rätt sida.

### Lösningen

Samma mönster som används för anställda-inbjudningar:

```typescript
// Nuvarande kod (rad 78-82):
const getScanUrl = () => {
  if (!existingToken || !selectedProjectId) return "";
  const baseUrl = window.location.origin;  // ← Problemet
  return `${baseUrl}/attendance/scan/...`;
};

// Ny kod:
const getScanUrl = () => {
  if (!existingToken || !selectedProjectId) return "";
  const baseUrl = "https://daglig-rad.lovable.app";  // ← Hårdkodad prod-URL
  return `${baseUrl}/attendance/scan/...`;
};
```

### Fil som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/attendance/QRCodeGenerator.tsx` | Byt `window.location.origin` mot produktions-URL |

### Enkel ändring

Detta är en enkel en-rads fix som följer samma mönster som redan etablerats i projektet för anställda-inbjudningar (`src/components/settings/EmployeeManager.tsx`, rad 206).

