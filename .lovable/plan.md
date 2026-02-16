

## Uppdatera GDPR-texten under "Personuppgifter" i offertforhandsgranskningen

### Vad andras

Den korta GDPR-texten under rubriken "Personuppgifter" pa sida 3 (Forutsattningar och villkor) byts ut mot den langre, specifika texten du angav. Detta gors i bade `QuoteLivePreview.tsx` (live-forhandsgranskningen i sidopanelen) och `QuotePreviewSheet.tsx` (fullskarms-forhandsgranskningen).

### Ny text

> Vid godkannande av denna offert accepterar du att vi behandlar dina personuppgifter for att kunna fullfoja vart atagande gentemot dig som kund. Den information vi behandlar for er ar information som berors och ar nodvandig for byggprojektens administration. Personuppgifterna lagras och hanteras i projektverktyget Bygglet som har tekniska och organisatoriska sakerhetsatgarder for att skydda hanteringen av Personuppgifter och lever upp till de krav som stalls enligt EU:s dataskyddsforordning (GDPR). Vi kommer om ni begar det att radera eller anonymisera och oavsett anledning dartill, inklusive att radera samtliga kopior som inte enligt GDPR maste sparas. Vi kommer inte att overfora Personuppgifter till land utanfor EU/ESS

### Tekniska andringar

| Fil | Rad | Andring |
|-----|-----|---------|
| `src/components/estimates/QuoteLivePreview.tsx` | 413-415 | Byt ut den korta texten mot den fullstandiga texten ovan |
| `src/components/estimates/QuotePreviewSheet.tsx` | 486-490 | Byt ut den befintliga langre texten mot den nya texten ovan |

Ingen annan logik eller struktur andras -- bara sjalva textstycket under "Personuppgifter".
