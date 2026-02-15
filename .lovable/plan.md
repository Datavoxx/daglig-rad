

## Grön shadow/glow på aktiv projektflik

### Vad ändras

Lägger till en grön shadow-glow-effekt på den aktiva fliken i projektnavigationen, precis som sidomenyn har. Den nuvarande `bg-primary/10` behålls men förstärks med en `box-shadow` i primärfärgen (grön).

### Teknisk ändring

**Fil: `src/pages/ProjectView.tsx`**

Uppdaterar alla sex `TabsTrigger`-element med en extra klass för grön shadow på aktiv state:

```
data-[state=active]:shadow-[0_0_12px_hsl(142,69%,45%,0.25)]
```

Detta ger en mjuk grön glöd runt den aktiva fliken -- samma känsla som sidomenyn.

Fullständig aktiv-klass per trigger blir:
```
data-[state=active]:bg-primary/10 data-[state=active]:rounded-md data-[state=active]:shadow-[0_0_12px_hsl(142,69%,45%,0.25)] data-[state=active]:text-primary
```

Dessutom läggs `data-[state=active]:text-primary` till explicit på varje trigger (förstärker att ikoner och text blir gröna).

### Resultat

Aktiv flik får:
- Ljusgrön bakgrund (redan finns)
- Grön text och ikon (förstärkt)
- Grön shadow/glow runt hela fliken (ny)

Inaktiva flikar förblir grå med subtil hover-effekt.

