
## Tydligare aktiv flik i projektnavigationen

Samma stil som sidomenyn: en primärfärgad markering, bakgrundsfärg och förstärkt ikon på den aktiva fliken.

### Vad ändras

**Fil: `src/pages/ProjectView.tsx`** -- TabsTrigger-klasserna

Varje `TabsTrigger` får uppdaterade klasser direkt i ProjectView (inte i den globala tabs.tsx, för att inte påverka andra ställen). Aktiv flik får:

- **Bakgrundsfärg**: `data-[state=active]:bg-primary/10` -- en lätt grön/primärfärgad bakgrund (samma mönster som sidomenyn)
- **Textfärg**: `data-[state=active]:text-primary` -- primärfärg på text och ikon
- **Bottenlinje**: Behåller `border-b-2 border-primary` (redan implementerat i tabs.tsx)
- **Rundade hörn**: `data-[state=active]:rounded-md` istället för `rounded-b-none` så att bakgrundsfärgen ser snygg ut
- **Förstärkt ikon**: Ikonen skalas upp lite med `scale-110` på aktiv flik (som sidomenyn gör)

Inaktiva flikar behåller `text-muted-foreground` och `hover:bg-muted/50` för en subtil hover-effekt.

### Tekniskt

Varje TabsTrigger i ProjectView.tsx får klassen:
```
className="flex items-center gap-1.5 min-w-fit data-[state=active]:bg-primary/10 data-[state=active]:rounded-md py-2 px-3"
```

Ikonen i varje trigger wrappas inte separat -- primärfärgen ärvs från `text-primary` på triggern.

Dessutom tas `data-[state=active]:rounded-b-none` bort från den globala `tabs.tsx` och ersätts med `data-[state=active]:rounded-md` så att bakgrundsfärgen har rundade hörn. Bottenborder-effekten behålls men kombineras med bakgrundsfärgen.

### Resultat

Den aktiva fliken får samma visuella "glow" som sidomenyn: en tydlig bakgrundsfärg + primärfärgad text/ikon + underkant, medan inaktiva flikar är nedtonade. Det blir omöjligt att missa vilken flik man är inne på.
