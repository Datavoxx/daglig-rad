

## Lägg till tre nya snabbval i AI-assistenten

### Vad som ändras

**Fil: `src/components/global-assistant/QuickSuggestions.tsx`**

Lägger till tre nya objekt i `suggestions`-arrayen:

| Label | Ikon | Prompt |
|-------|------|--------|
| Uppdatera projekt | FolderKanban (eller Pencil) | "Jag vill uppdatera ett projekt" |
| Ny arbetsorder | ClipboardList | "Skapa en ny arbetsorder" |
| Skapa planering | CalendarDays | "Skapa en planering för ett projekt" |

Dessa läggs till efter de befintliga 7 förslagen. Ikoner väljs bland de som redan importeras eller som finns i lucide-react (t.ex. `Pencil`, `CalendarDays`, `Wrench`).

### Teknisk detalj

- Importera `Pencil` och `CalendarDays` från `lucide-react`
- Lägg till tre nya objekt i `suggestions`-arrayen
- Ingen annan fil behöver ändras

