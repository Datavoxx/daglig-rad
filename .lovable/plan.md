

## Fix: E-postinbjudningar levereras inte

### Problem
Resend-API:et returnerar "success" (inget error-objekt), men mejlen levereras aldrig till mottagarna. Koden loggar bara `error` fran Resend -- inte `data`-objektet som innehaller e-post-ID och eventuella varningar.

### Grundorsak (mest troligt)
Domanen `datavoxx.se` ar troligen inte fullstandigt verifierad i Resend. Nar en doman inte ar verifierad koar Resend i **sandbox-lage** dar mejl bara levereras till kontots agare -- inte till externa mottagare. API:et returnerar anda "success", vilket ar vilseledande.

### Losning i tva steg

**Steg 1: Battre loggning (kodandring)**

Uppdatera `supabase/functions/send-employee-invitation/index.ts` for att logga hela Resend-svaret (bade `data` och `error`). Detta ger oss e-post-ID:t och eventuella problem.

```typescript
// Rad 221-226: Andra fran
const { error: emailError } = await resend.emails.send({ ... });

// Till
const { data: emailData, error: emailError } = await resend.emails.send({ ... });
console.log("Resend response data:", JSON.stringify(emailData));
console.log("Resend response error:", JSON.stringify(emailError));
```

**Steg 2: Verifiera domanen i Resend (manuellt steg)**

Du behover logga in pa [resend.com/domains](https://resend.com/domains) och:
1. Kontrollera att `datavoxx.se` ar listad och har status **Verified**
2. Om den inte ar verifierad: lagg till de DNS-poster (SPF, DKIM, DMARC) som Resend visar
3. Kontrollera att din API-nyckel ar kopplad till ratt doman

### Teknisk sammanfattning

| Andring | Fil | Syfte |
|---------|-----|-------|
| Logga Resend `data`-objekt | `supabase/functions/send-employee-invitation/index.ts` | Se e-post-ID och faktiskt svar fran Resend |
| Verifiera doman | Resend dashboard (manuellt) | Aktivera leverans till externa mottagare |

### Alternativ om domanen inte kan verifieras

Om det ar brakttom kan vi tilfalligt byta avsandaradress till `onboarding@resend.dev` (Resends testdoman som alltid fungerar) medan DNS-verifieringen ordnas.
