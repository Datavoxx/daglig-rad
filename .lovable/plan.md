
### Vad som händer (varför den “är kvar”)
Det du ser (vit ruta/”kort” bakom Saga-bilden) beror nästan alltid på att webbläsaren fortfarande visar en cache:ad version av `saga-avatar.png` (eller den bundlade/hashede varianten). Även om filen på disk är uppdaterad kan UI:t fortfarande peka på en gammal asset som ligger kvar i cache/CDN.

Jag ser också att både din nuvarande `src/assets/saga-avatar.png` och den uppladdade `removebg-preview-3.png` ser likadana ut när jag öppnar dem här — vilket stärker misstanken att problemet är cache/asset-bundling snarare än att “fel fil” ligger i projektet.

### Mål
Tvinga fram att appen använder en helt ny filreferens (nytt filnamn), så att cache inte kan återanvändas, och Saga blir identisk med Bo/Ulla i UI.

---

## Åtgärdsplan: Cache-busta Sagas avatar genom nytt filnamn + uppdatera imports

### 1) Lägg in nya bilden som en NY fil i `src/assets/`
- Kopiera `user-uploads://ChatGPT_Image_2_feb._2026_23_21_44-removebg-preview-3.png`
- Spara som t.ex. `src/assets/saga-avatar-transparent.png` (nytt namn = cache-bust)

Varför: samma filnamn (`saga-avatar.png`) kan fortsätta cache:as. Nytt filnamn ger ny bundlad URL direkt.

### 2) Uppdatera alla imports som pekar på `saga-avatar.png`
Jag har hittat minst dessa filer som importerar Saga-avatar:

- `src/components/landing/AIAgentsSection.tsx`
- `src/pages/ai/AgentDetail.tsx`
- `src/config/aiAgents.ts`

Ändra:
```ts
import sagaAvatar from "@/assets/saga-avatar.png";
```
till:
```ts
import sagaAvatar from "@/assets/saga-avatar-transparent.png";
```

### 3) Säkerställ att inget annat i projektet fortfarande använder gamla filen
- Kör en global sökning efter `saga-avatar.png` och byt ut eventuella rester.
- Om det finns någon fallback eller hårdkodad URL (ovanligt), uppdatera även den.

### 4) Verifiering i preview (snabb check)
Efter ändringen:
- Ladda om sidan med hård refresh (om möjligt) och/eller öppna i privat fönster.
- Gå till `/#ai-agents` och bekräfta att Saga inte längre har vit ruta/bakgrund.

### 5) (Valfritt men rekommenderat) Ta bort eller lämna kvar gamla filen
- Vi kan lämna `src/assets/saga-avatar.png` kvar utan att den används.
- Alternativt kan vi senare städa bort den om du vill (men det är inte nödvändigt för att lösa problemet).

---

## Förväntat resultat
- Saga laddas från en ny asset-URL och kan inte “råka” visas från gammal cache.
- Hon får samma transparenta look som Bo och Ulla på korten.

---

## Tekniska noter (för tydlighet)
- Vite bygger assets till cachevänliga URLs. Om filnamnet inte ändras kan en gammal variant ibland fortsätta visas beroende på cache-lager.
- Ny fil + uppdaterad import är den säkraste metoden för att tvinga fram rätt bild i alla miljöer.
