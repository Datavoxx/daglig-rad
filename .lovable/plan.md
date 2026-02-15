

## 6 Förbättringar i Byggio

### 1. Felmeddelande vid fel inloggning
Idag sätts `validationError` men visas aldrig synligt i UI:t. Felmeddelandet ska visas som en röd alert-banner mellan "Byggprojekt, enkelt och digitalt" och "E-post"-fältet.

**Fil: `src/pages/Auth.tsx`**
- Lägg till import av `Alert, AlertDescription` från `@/components/ui/alert`
- Lägg till import av `AlertCircle` från lucide-react
- Mellan `CardDescription` och `<form>` (rad 82-84): rendera `validationError` i en röd alert-komponent
- Rensa `validationError` när användaren börjar skriva (onChange i email/password)

---

### 2. Glömt lösenord-funktion
Lägg till en "Glömt lösenord?"-länk på login-sidan som öppnar ett inline-formulär (eller en ny vy) där användaren anger sin e-post. Supabase Auth har inbyggt stöd via `supabase.auth.resetPasswordForEmail()`.

**Fil: `src/pages/Auth.tsx`**
- Lägg till state: `forgotPassword`, `resetEmail`, `resetSent`, `resetLoading`
- Under lösenordsfältet (rad 120), lägg till en "Glömt lösenord?"-länk
- Vid klick: visa ett enkelt formulär med e-postfält och "Skicka"-knapp
- Anropa `supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: window.location.origin + "/auth" })`
- Visa bekräftelsetext efter lyckad skickning
- Ingen ny sida behövs -- allt hanteras inline i samma Card

**Fil: `src/pages/Auth.tsx`** (ytterligare)
- Hantera lösenordsåterställning: lägg till useEffect som lyssnar på `SIGNED_IN` event med `type === "PASSWORD_RECOVERY"` och navigerar till en enkel lösenordsändringsvy
- Alternativt: skapa en minimal vy i Auth.tsx som visar "Nytt lösenord"-formulär och anropar `supabase.auth.updateUser({ password })`

---

### 3. Formulär för ÄTA, Filer/Bilagor och Planering i "Uppdatera projekt"
Idag skickar "Uppdatera projekt" bara en textprompt till AI:n utan eget formulär för ÄTA, filer och planering. Arbetsorder och dagbok har egna formulär -- samma behövs för de andra tre.

**Ny fil: `src/components/global-assistant/AtaFormCard.tsx`**
- Formulär med fält: beskrivning, orsak, uppskattad kostnad, uppskattade timmar
- Matchar det som `create_ata` i edge-funktionen förväntar sig

**Ny fil: `src/components/global-assistant/FileUploadFormCard.tsx`**
- Formulär med filinmatning (bild/fil-uppladdning)
- Laddar upp filen till Supabase Storage (`project-files` bucket)
- Sparar referens i `project_files`-tabellen
- Visar förhandsgranskning av vald bild

**Modifiering av befintligt planering-flöde:**
- `PlanningFormCard` finns redan -- behöver kopplas korrekt via `handleUpdateProjectAction`

**Fil: `src/pages/GlobalAssistant.tsx`**
- Uppdatera `handleUpdateProjectAction` för att:
  - `ata`: visa `ata_form` med `type: "ata_form"` istället för att skicka textprompt
  - `files`: visa `file_upload_form` med `type: "file_upload_form"`
  - `planning`: visa `planning_form` (redan existerande)
- Lägg till handlers: `handleAtaFormSubmit`, `handleAtaFormCancel`, `handleFileUploadSubmit`, `handleFileUploadCancel`

**Fil: `src/components/global-assistant/MessageList.tsx`**
- Importera `AtaFormCard` och `FileUploadFormCard`
- Lägg till rendering för `message.type === "ata_form"` och `message.type === "file_upload_form"`
- Skicka igenom nya props

---

### 4. "Budget översikt" som snabbval
Lägg till "Budget översikt" i QuickSuggestions som triggar projektval och sedan hämtar ekonomiöversikt.

**Fil: `src/components/global-assistant/QuickSuggestions.tsx`**
- Lägg till nytt objekt i `suggestions`-arrayen:
  ```
  { label: "Budget översikt", icon: Receipt (eller Wallet), prompt: "Visa budget översikt för ett projekt" }
  ```
- Edge-funktionen hanterar redan `get_project_economy` som returnerar ekonomikortet -- AI:n kommer välja rätt tool automatiskt

---

### 5. Ta bort QR-kod från personalliggare
QRCodeGenerator-komponenten ska tas bort från Attendance-sidan.

**Fil: `src/pages/Attendance.tsx`**
- Ta bort import av `QRCodeGenerator`
- Ta bort `<QRCodeGenerator projects={projects} />` (rad 254)

---

### 6. Feedback-timing: session-feedback bara vid utloggning, AI-feedback direkt
Två ändringar:

**6a. Ta bort inaktivitets-feedback (bara vid utloggning)**

**Fil: `src/components/layout/AppLayout.tsx`**
- Ta bort `useInactivityTimer`-importen och anropet (rad 30, 91-94)
- Behåll bara `handleLogoutClick` som trigger för `SessionFeedbackPopup`

**6b. AI-feedback direkt efter chatten (inte 30 sek fördröjning)**

**Fil: `src/contexts/ConversationFeedbackContext.tsx`**
- Ändra timeouten från 30000ms till 0ms (eller ta bort setTimeout helt)
- Visa popup direkt när användaren lämnar `/global-assistant` (om konversation finns)

---

### Teknisk sammanfattning

| Punkt | Filer att ändra/skapa |
|-------|----------------------|
| 1 | `src/pages/Auth.tsx` |
| 2 | `src/pages/Auth.tsx` |
| 3 | Nya: `AtaFormCard.tsx`, `FileUploadFormCard.tsx`. Ändra: `MessageList.tsx`, `GlobalAssistant.tsx`, `global-assistant.ts` (types) |
| 4 | `src/components/global-assistant/QuickSuggestions.tsx` |
| 5 | `src/pages/Attendance.tsx` |
| 6 | `src/components/layout/AppLayout.tsx`, `src/contexts/ConversationFeedbackContext.tsx` |

