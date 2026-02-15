
## Fix: Grön markering syns inte pa aktiva projektflikar

### Problem
Trots att Tailwind-klasser som `data-[state=active]:bg-primary/10` och `data-[state=active]:shadow-[...]` finns i koden, renderas de inte visuellt. Trolig orsak: Tailwinds arbitrary value-syntax for shadow fungerar inte korrekt i kombination med `data-[state=active]`, och `tailwind-merge` kan stripa klasserna.

### Losning

Byt strategi -- istallet for att forlita sig pa Tailwind arbitrary values, definiera en CSS-klass i `index.css` som hanterar den grona glow-effekten, och anvand den i ProjectView.

**Steg 1: `src/index.css`** -- Lagg till en CSS-klass

```css
.tab-active-glow[data-state="active"] {
  background-color: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  border-radius: 0.375rem;
  box-shadow: 0 0 12px hsl(142 69% 45% / 0.25);
}
```

**Steg 2: `src/pages/ProjectView.tsx`** -- Forenkla TabsTrigger-klasserna

Ta bort alla `data-[state=active]:bg-primary/10`, `data-[state=active]:text-primary`, `data-[state=active]:rounded-md` och `data-[state=active]:shadow-[...]` fran varje TabsTrigger.

Lagg istallet till klassen `tab-active-glow` pa varje trigger:

```tsx
<TabsTrigger value="overview" className="flex items-center gap-1.5 min-w-fit tab-active-glow hover:bg-muted/50 py-2 px-3">
```

Alla sex triggers (Oversikt, ATA, Arbetsorder, Filer, Planering, Dagbok) uppdateras pa samma satt.

### Resultat
- Gron bakgrund pa aktiv flik
- Gron text och ikoner
- Gron shadow/glow runt aktiv flik (samma kansla som sidomenyn)
- Fungerar garanterat eftersom vi anvander ren CSS istallet for Tailwind arbitrary values
