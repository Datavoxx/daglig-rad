
## Förbättra "Ny ÄTA"-dialogen: Flera rader och scrollbar

### Problem
1. Dialogen för "Ny ÄTA" stöder bara en enda rad (artikel + antal + pris). Användare vill kunna lägga till flera rader i samma ÄTA.
2. På mindre skärmar (t.ex. MacBook Air) kan inte hela dialogen ses -- det saknas scroll.

### Ändringar i `src/components/projects/ProjectAtaTab.tsx`

#### 1. Stöd för flera rader i formuläret
- Byt ut de enskilda fälten för Artikel, Enhet, Antal och À-pris mot en dynamisk radlista (liknande `InvoiceRowEditor`-mönstret som redan finns i projektet)
- Varje rad har: Artikel (select), Enhet (select), Beskrivning (input), Antal (number), À-pris (number), och en ta-bort-knapp
- En "Lägg till rad"-knapp i botten
- Formuläret startar med en rad som standard

#### 2. Gör dialogen scrollbar
- Lägg till `max-h-[80vh] overflow-y-auto` på dialogens innehållsdel så att den blir scrollbar på mindre skärmar
- Bredda dialogen till `max-w-2xl` för att ge mer plats åt raderna

#### 3. Uppdatera submit-logiken
- `handleSubmit` loopar över alla rader och skapar en separat `project_ata`-post per rad (varje rad får eget ÄTA-nummer)
- "Beskrivning" och "Anledning" blir gemensamma fält (inte per rad) -- beskrivningen på den första raden kan användas som fallback
- Alternativt: varje rad blir en egen ÄTA-post med individuell beskrivning

#### 4. Datastruktur
Formulärets state uppdateras till att hålla en array av rader:

```text
formData = {
  rows: [
    { article, unit, description, quantity, unit_price, rot_eligible }
  ],
  reason: string,
  status: string
}
```

Varje rad sparas som en separat ÄTA-post i databasen (samma mönster som idag, en post per rad).

### Teknisk sammanfattning

| Fil | Ändring |
|-----|---------|
| `src/components/projects/ProjectAtaTab.tsx` | Refaktorera dialogformuläret till multi-rad, lägg till scroll, bredda dialogen |

### Resultat
- Användare kan lägga till flera ÄTA-rader i en och samma dialog
- Dialogen fungerar på mindre skärmar tack vare scrollning
- Varje rad sparas som en separat ÄTA-post med eget ÄTA-nummer
