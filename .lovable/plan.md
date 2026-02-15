

## Fix: Lösenordsåterställning redirectar till vanlig inloggning

### Problem
När användaren klickar på återställningslänken i mejlet, hamnar de på vanliga inloggningssidan istället för formuläret för nytt lösenord. Orsaken är att `https://byggio.io/auth` inte finns med i listan över tillåtna redirect-URLer i autentiseringsinställningarna. Utan det tar inte backend emot recovery-token korrekt.

### Lösning

**Steg 1: Lägg till byggio.io som tillåten redirect-URL**

Via autentiseringskonfigurationen behöver `https://byggio.io/auth` läggas till som en godkänd redirect-URL. Detta gör att recovery-token skickas med korrekt till din domän.

**Steg 2: Verifiera att koden fungerar**

Koden i `Auth.tsx` är redan korrekt uppbyggd. Den lyssnar på `PASSWORD_RECOVERY`-eventet och visar formuläret för nytt lösenord. Problemet är enbart att redirect-URLen inte är godkänd i backend.

### Teknisk sammanfattning

| Ändring | Vad |
|---------|-----|
| Autentiseringskonfiguration | Lägg till `https://byggio.io/auth` som tillåten redirect-URL |

Ingen kodändring behövs -- bara en konfigurationsuppdatering i backend.

