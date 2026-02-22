

## Ta bort "Laddar..."-text och visa loggan direkt

### Vad som ändras

Komponenten `ByggioLoader` uppdateras så att:
1. Texten "Laddar..." tas bort helt
2. Loggan visas direkt med samma puls-animation som idag (ingen fördröjning)

### Tekniskt

En enda fil ändras: `src/components/shared/ByggioLoader.tsx`

- Ta bort `<p>Laddar...</p>`-elementet
- Behåll loggan med `animate-byggio-pulse`-klassen exakt som den är

