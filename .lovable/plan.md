

## Plan: Uppdatera Guide-PDF med Byggio-logga och grönt tema

### Översikt
Uppdatera PDF-generatorn för guiden så att den alltid visar Byggio-loggan i headern och använder Byggios gröna temafärger istället för det nuvarande grå temat.

---

### Ändringar i `src/lib/generateGuidePdf.ts`

**1. Importera Byggio-loggan direkt:**
```tsx
import byggioLogo from "@/assets/byggio-logo.png";
```

**2. Lägg till en funktion för att konvertera den importerade loggan till base64:**
```tsx
async function getByggioLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch(byggioLogo);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
}
```

**3. Uppdatera färgtemat till Byggio-grönt:**

Nya färger (baserat på Byggio-loggan):
| Färg | Gammalt värde | Nytt värde |
|------|--------------|------------|
| Header-bar | slate-700 `[51, 65, 85]` | green-700 `[21, 128, 61]` |
| Rubriker | slate-800 `[30, 41, 59]` | green-800 `[22, 101, 52]` |
| Sektionsrubriker | slate-800 | green-700 `[21, 128, 61]` |

**4. Lägg till loggan i PDF-headern:**

Istället för att endast visa loggan om `companySettings` finns, hämta alltid Byggio-loggan:

```tsx
// Hämta Byggio-loggan
const byggioLogoBase64 = await getByggioLogoBase64();

// Lägg till logga i övre vänstra hörnet
if (byggioLogoBase64) {
  doc.addImage(byggioLogoBase64, "PNG", margin, 12, 35, 12, undefined, "FAST");
}
```

---

### Visuell förändring

**Före:**
```
┌──────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓ GRÅTT HEADER-BAR ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                          │
│ BYGGIO GUIDE (svart text)               │
│ Din kompletta guide... (grå text)        │
└──────────────────────────────────────────┘
```

**Efter:**
```
┌──────────────────────────────────────────┐
│ ████████ GRÖNT HEADER-BAR ██████████████ │
│                                          │
│ [BYGGIO LOGGA]                          │
│                                          │
│ BYGGIO GUIDE (grön text)                │
│ Din kompletta guide... (grå text)        │
└──────────────────────────────────────────┘
```

---

### Teknisk detaljplan

| Rad | Ändring |
|-----|---------|
| 1-2 | Lägg till import för `byggioLogo` |
| 9-20 | Lägg till `getByggioLogoBase64()` hjälpfunktion |
| 33-34 | Uppdatera färger i `addSectionHeader` till grön |
| 66 | Ändra header-bar till grön färg |
| 70-77 | Ändra logik för att alltid visa Byggio-logga |
| 83 | Uppdatera titelfärg till grön |
| 215 | Behåll grå footer-text (neutral) |

---

### Nya lokala färgkonstanter

Definiera Byggio-specifika färger i `generateGuidePdf.ts`:

```tsx
const BYGGIO_COLORS = {
  GREEN_DARK: [22, 101, 52] as [number, number, number],   // green-800
  GREEN_PRIMARY: [21, 128, 61] as [number, number, number], // green-700
  GREEN_LIGHT: [34, 197, 94] as [number, number, number],  // green-500
};
```

---

### Slutresultat

- Byggio-loggan visas alltid i PDF-headern
- Header-baren är grön istället för grå
- Rubriker använder Byggios gröna tema
- Professionellt och varumärkeskonsekvent utseende

