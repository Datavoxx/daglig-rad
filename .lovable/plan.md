
## Gor projektkoppling obligatorisk for kvitton

### Vad andras
Projektvalet i `ReceiptUploadDialog` andras fran valfritt till obligatoriskt. Anvandaren maste valja ett projekt innan kvittot kan sparas.

### Teknisk andring

**`src/components/invoices/ReceiptUploadDialog.tsx`**

1. **Labeln** (rad ~299): Ta bort "(valfritt)" fran texten "Koppla till projekt".
2. **Ta bort "Inget projekt"-alternativet** i Select-komponenten (rad ~305) -- det ska inte ga att valja "none".
3. **Disable Spara-knappen** om inget projekt ar valt: lagg till `disabled={isSaving || projectId === "none"}` pa Spara-knappen (rad ~314).
4. **Visa hjalpmedelande** om inget projekt ar valt, t.ex. en liten text under Select: "Valj ett projekt for att spara kvittot".

Ingen databasandring behovs -- `project_id` ar redan en kolumn i `receipts`-tabellen.
