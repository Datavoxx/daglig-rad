

## Fix: AI lovar saker den inte kan gora (PDF, mejla, etc.)

### Problem

Byggio AI papekar att den kan "skapa en PDF" och "lagga upp en nedladdningslanken" eller "mejla filen" nar anvandaren fragar om ekonomirapporter. Detta ar falskt -- assistenten har INGA verktyg for att generera PDF:er, skicka mejl eller skapa nedladdningslankar (forutom det som redan ar inbyggt i offert-floden).

AI:n hallucinerar dessa formagar eftersom systemprompten inte explicit forbjuder det.

### Losning

Lagg till en `<restrictions>`-sektion i systemprompten som tydligt listar vad AI:n INTE kan gora. Detta hindrar modellen fran att lova funktionalitet som inte finns.

### Teknisk implementation

**Fil: `supabase/functions/global-assistant/index.ts`**

Lagg till foljande sektion i systemprompten (efter `<rules>`-sektionen, rad ~4747):

```
<restrictions>
DU KAN INTE:
- Skapa PDF-filer eller generera dokument
- Skicka e-post eller mejla filer
- Lagga upp nedladdningslankar
- Komma at externa system eller API:er
- Gora berakningar utover vad verktygen returnerar

Om anvandaren fragar om nagon av dessa saker:
- Forklara att du inte kan gora det fran chatten
- Hanvisa till ratt del av systemet (t.ex. "Du kan ladda ner PDF fran projektsidan" eller "Ga till Fakturor for att exportera")
</restrictions>
```

### Filandringar

| Fil | Andring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Lagg till `<restrictions>` i systemprompten |
