

## Pinch-to-zoom och panorering i offertens forhandsgranskning (mobil)

### Problem

Pa mobilen anvands en fast CSS-skalning (`scale-[0.55]` med `w-[182%]`) som gor att hoger sida klipps bort och man varken kan zooma eller scrolla horisontellt.

### Losning

Bygga en **pinch-to-zoom-container** som omsluter offertinnehallet pa mobilen. Anvandaren kan:
- **Zooma in/ut** med tva fingrar (pinch)
- **Panorera** (dra) horisontellt och vertikalt
- **Dubbelklicka** for att vaxla mellan inzoomad och utzoomad vy
- Starta utzoomad sa att hela papprets bredd syns

### Teknisk detalj

| Fil | Andring |
|-----|---------|
| `src/components/estimates/PinchZoomContainer.tsx` | **Ny fil** -- en ateranvandbar komponent som hanterar touch-gester (pinch, pan, double-tap) med React state och touch-events |
| `src/components/estimates/QuotePreviewSheet.tsx` | Byt ut den fasta `scale-[0.55] w-[182%]` pa mobil mot `PinchZoomContainer`. Desktop oforandrad |
| `src/components/estimates/QuoteLivePreview.tsx` | Samma andring -- byt ut fast skalning mot `PinchZoomContainer` |

### PinchZoomContainer-komponenten

- Hanterar `onTouchStart`, `onTouchMove`, `onTouchEnd` for pinch och pan
- State: `scale` (startar pa ~0.48 sa att 210mm-bredden passar skarmbredden), `translateX`, `translateY`
- Min-zoom: ca 0.4 (hela pappret synligt), Max-zoom: 1.5 (narzoom)
- Dubbelklick/dubbeltryck vaxlar mellan min-zoom och 1.0
- Anvander `touch-action: none` for att forhindra webbkasarens standardgester
- Renderas bara pa mobil; pa desktop visas innehallet som vanligt

### Resultat

Anvandaren kan se hela offertforhandsgranskningen pa telefonen, zooma in for att lasa detaljer, och panorera fritt i alla riktningar.
