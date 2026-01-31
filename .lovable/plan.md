
## Plan: Använd publicerad URL för inbjudningar

### Problem
Inbjudningslänken skapas med `window.location.origin` vilket ger preview-URL:en som går genom Lovable's infrastruktur och visar en redirect-sida först.

### Lösning
Ändra så att inbjudningslänken alltid använder den publicerade URL:en.

---

### Alternativ 1: Hårdkodad produktions-URL (rekommenderat)

**Ändringar i `EmployeeManager.tsx`:**

Istället för:
```typescript
baseUrl: window.location.origin
```

Använd:
```typescript
baseUrl: "https://daglig-rad.lovable.app"
```

**Fördelar:** Enkelt och direkt. Länken går direkt till appen utan redirect.

**Nackdel:** Om du byter domän måste du uppdatera koden.

---

### Alternativ 2: Miljövariabel (mer flexibelt)

Använd `VITE_APP_URL` eller liknande för att kunna konfigurera detta per miljö.

---

### Rekommendation

**Alternativ 1** är enklast och fungerar direkt. Vi ändrar en rad i `EmployeeManager.tsx`:

| Fil | Ändring |
|-----|---------|
| `src/components/settings/EmployeeManager.tsx` | Byt `window.location.origin` till `"https://daglig-rad.lovable.app"` |

---

### Resultat

Inbjudningslänken blir:
```
https://daglig-rad.lovable.app/accept-invitation?token=abc123...
```

Användaren klickar och kommer direkt till aktiveringssidan utan mellanliggande redirect.
