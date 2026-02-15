

## 3 Fixar: Scroll, Budget-formulär och Lösenordsåterställning

### 1. Ta bort yttre scroll på Global Assistant

AppLayout wrappar allt i `<main className="flex-1 overflow-auto">` med padding. GlobalAssistant har sin egen scrollhantering, vilket skapar dubbelscroll och dead space.

**Fil: `src/components/layout/AppLayout.tsx`** (rad 428-433)

- Importera `useLocation` och kolla `pathname`
- Om pathname === `/global-assistant`: satt `overflow-hidden` på main och ta bort padding/max-width på wrappern
- Alla andra sidor behaller sin padding och scroll som vanligt

```
main: overflow-hidden (istallet for overflow-auto)
wrapper: h-full, ingen padding/max-width
```

---

### 2. Budget oversikt med projektval-formular

Idag skickas "Visa budget oversikt for ett projekt" som en vanlig textprompt och AI:n svarar med "Ange projektnamn eller projekts-ID". Istallet ska det visa ett formular dar man valjer projekt -- precis som "Uppdatera projekt" gor.

**Fil: `src/pages/GlobalAssistant.tsx`**

- I `sendMessage`-funktionens response-hantering: nar AI:n svarar med `get_project_economy` som behover projekt-ID, hantera det klientside
- Alternativt (enklare): skapa en ny handler som triggas nar man klickar "Budget oversikt". Istallet for att skicka textprompt, hamta projektlistan och visa ett projektval-formular -- och nar man valjer projekt, skicka "Visa budget oversikt for [projektnamn]" med kontext `{ selectedProjectId }`.

**Ny komponent (eller ateranvand befintlig logik):**
- Fanga "Budget oversikt"-klicket i `QuickSuggestions`
- Hamta projektlistan fran databasen
- Visa ett enkelt projektval-formular (Select-komponent)
- Nar man valjer: skicka meddelande med projekt-ID i context

Konkret: Vi andrar sa att "Budget oversikt" i QuickSuggestions inte skickar `onSelect(prompt)` direkt, utan istallet triggar en callback som visar ett projektval-kort. Vi kan ateranvanda logiken fran UpdateProjectFormCard (som redan har projektlista + select).

**Ny fil: `src/components/global-assistant/BudgetOverviewFormCard.tsx`**
- Enkelt kort med projektval (Select-komponent)
- "Visa budget"-knapp
- Vid submit: skicka meddelande med valt projektnamn

**Fil: `src/pages/GlobalAssistant.tsx`**
- Lagg till handler for budget-forfragan
- Hamta projekten fran databasen
- Visa formularkortet som ett meddelande
- Vid submit: skicka "Visa budget oversikt for [projekt]"

**Fil: `src/components/global-assistant/QuickSuggestions.tsx`**
- Andra "Budget oversikt"-knappen att anropa en separat callback istallet for `onSelect`

**Fil: `src/components/global-assistant/MessageList.tsx`**
- Rendera det nya `budget_form`-meddelandet

---

### 3. Losenordsaterstellning (Reset Password-sidan)

Problemet: Nar man klickar "Reset Password" i mejlet, redirectas man till `/auth` med en hash-fragment som innehaller recovery-token. Men Supabase-klienten maste kunna fanga upp detta och trigga `PASSWORD_RECOVERY`-eventet. Nuvarande kod lyssnar pa detta event redan -- men det kan finnas problem med att hash-fragmenten inte processas korrekt.

**Fil: `src/pages/Auth.tsx`**

- Se till att `supabase.auth.onAuthStateChange` lyssnar korrekt (redan implementerat)
- Problemet ar troligen att sidan mountas, `getSession()` aldrig anropas, sa recovery-token i URL:en inte processas
- Lagg till ett explicit anrop till `supabase.auth.getSession()` i useEffect vid mount -- detta triggar Supabase att parsa hash-fragmentet och emittera `PASSWORD_RECOVERY`-eventet
- Se aven till att recovery-vyn (som redan finns) renderas korrekt

Tillagg i useEffect:
```
useEffect(() => {
  supabase.auth.getSession(); // Triggers parsing of hash fragment
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      setIsRecoveryMode(true);
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

---

### Teknisk sammanfattning

| Fix | Filer |
|-----|-------|
| 1. Scroll | `src/components/layout/AppLayout.tsx` |
| 2. Budget-formular | Ny: `BudgetOverviewFormCard.tsx`. Andra: `QuickSuggestions.tsx`, `GlobalAssistant.tsx`, `MessageList.tsx`, `global-assistant.ts` (types) |
| 3. Reset password | `src/pages/Auth.tsx` |
