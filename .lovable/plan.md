
## Lagg till ATA-sektion i villkorssidan

### Vad andras

En ny rubrik **"ATA (andrings- och tillaggsarbeten)"** laggs till mellan "Betalningsvillkor" och "Personuppgifter" (eller ROT om den finns) pa sida 3 i offerten. Texten forklarar att om det uppstar hinder eller tillkommande arbete sa skickas en separat offert for ATA.

### Foreslag pa text

> Skulle det under projektets gang uppsta oforutsedda forhallanden eller behov av andringar som paverkar det avtalade arbetet, kommer vi att upprata en separat ATA-offert (andrings- och tillaggsarbeten) for godkannande innan arbetet paborjas. Inget tillkommande arbete utfors utan skriftligt godkannande.

### Filer som andras

| Fil | Plats | Andring |
|-----|-------|---------|
| `QuoteLivePreview.tsx` | Rad 406-407 (efter Betalningsvillkor, fore ROT/Personuppgifter) | Lagg till ny `<div>` med rubrik "ATA" och textstycket |
| `QuotePreviewSheet.tsx` | Rad 477-479 (efter Betalningsvillkor, fore ROT/Personuppgifter) | Samma ny sektion |
| `generateQuotePdf.ts` | Rad 625 (efter Betalningsvillkor-blocket, fore ROT-blocket) | Lagg till rubrik + text med `splitTextToSize` |

### Teknisk detalj

Sektionen ar alltid synlig (inte villkorad) eftersom ATA-information ar relevant oavsett projekttyp. Ingen ny data eller props behovs -- det ar en statisk textsektion.
