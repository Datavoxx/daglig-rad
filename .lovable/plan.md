

## QR-kod för Personalliggare - Snabb incheckning på arbetsplatsen

### Vad som ska byggas

En QR-kodfunktion som gör det möjligt att checka in/ut på arbetsplatsen genom att bara scanna en kod. Varje projekt får en unik QR-kod som kan skrivas ut och sättas upp på bygget.

### Hur det fungerar

```text
┌─────────────────────────────────────────────────────────────┐
│  ARBETSPLATS: Villan på Storgatan                           │
│                                                             │
│        ┌─────────────────────────┐                          │
│        │                         │                          │
│        │     [QR-KOD HÄR]        │  ← Skanna med mobilen    │
│        │                         │                          │
│        └─────────────────────────┘                          │
│                                                             │
│  Skanna för att checka in/ut                                │
└─────────────────────────────────────────────────────────────┘
```

**Flöde för arbetaren:**
1. Arbetaren anländer till arbetsplatsen
2. Scannar QR-koden med sin mobil (kameran)
3. Öppnas i webbläsaren → automatisk incheckning
4. När hen går hem, scannar igen → automatisk utcheckning

**Flöde för administratören:**
1. Går till Personalliggare-sidan
2. Klickar "Visa QR-kod" på ett projekt
3. Skriver ut och sätter upp vid entrén

---

### Teknisk design

#### Ny publik route

```
/attendance/scan/:projectId/:token
```

- **projectId**: vilket projekt det gäller
- **token**: en unik säkerhetsnyckel per projekt

#### Databasändring

Ny tabell: `attendance_qr_tokens`

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| project_id | uuid | Vilket projekt |
| token | text | Unik kod (32 tecken) |
| created_by | uuid | Vem som skapade |
| created_at | timestamptz | När skapad |

#### Nya bibliotek

- `qrcode.react` - Generera QR-koder i React (litet, populärt)

---

### Nya komponenter

#### 1. QR-kod generator (admin-sida)

```text
┌─────────────────────────────────────────────────────────────┐
│  Personalliggare                                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐
│  │ [Välj projekt ▼]            [Skapa QR-kod]              │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐
│  │               ┌───────────┐                             │
│  │               │  QR-KOD   │                             │
│  │               │           │                             │
│  │               └───────────┘                             │
│  │                                                         │
│  │   Villan på Storgatan 15                                │
│  │   Skanna för att checka in/ut                           │
│  │                                                         │
│  │   [🖨️ Skriv ut]  [📋 Kopiera länk]  [🔄 Ny kod]        │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Publik scan-sida (för arbetare)

```text
┌─────────────────────────────────────────────────────────────┐
│                    PERSONALLIGGARE                          │
│                                                             │
│            Villan på Storgatan 15, Malmö                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐
│  │                                                         │
│  │   [LOGGA IN FÖR ATT CHECKA IN]                          │
│  │                                                         │
│  │   --- ELLER ---                                         │
│  │                                                         │
│  │   Skriv ditt namn:                                      │
│  │   ┌────────────────────────────────────────────────┐    │
│  │   │ Erik Svensson                                  │    │
│  │   └────────────────────────────────────────────────┘    │
│  │                                                         │
│  │   [CHECKA IN]                                           │
│  │                                                         │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Två alternativ för incheckning:**
- **Inloggad användare**: Automatisk koppling till deras konto
- **Gäst**: Ange namn manuellt (för underentreprenörer etc.)

---

### Implementation

#### Databasmigrering

```sql
-- Tabell för QR-tokens
CREATE TABLE attendance_qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Lägg till guest_name i attendance_records för gäster
ALTER TABLE attendance_records 
ADD COLUMN guest_name text;

-- RLS
ALTER TABLE attendance_qr_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens"
  ON attendance_qr_tokens FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Anyone can view tokens"
  ON attendance_qr_tokens FOR SELECT
  USING (true);
```

#### Nya filer

| Fil | Beskrivning |
|-----|-------------|
| `src/pages/AttendanceScan.tsx` | Publik scan-sida |
| `src/components/attendance/QRCodeGenerator.tsx` | Generera/visa QR-kod |
| `src/components/attendance/QRCodePrintView.tsx` | Utskriftsvy |

#### Uppdaterade filer

| Fil | Ändring |
|-----|---------|
| `src/pages/Attendance.tsx` | Lägg till QR-kod sektion |
| `src/App.tsx` | Ny publik route `/attendance/scan/:projectId/:token` |
| `package.json` | Lägg till `qrcode.react` |

---

### Säkerhet

1. **Token-baserad validering**: Endast giltiga tokens fungerar
2. **Projekt-koppling**: Token är bunden till specifikt projekt
3. **Kan återkallas**: Admin kan skapa ny token (ogiltigförklarar den gamla)
4. **Gäster kräver namn**: Manuell inmatning för spårbarhet

---

### Mobil-optimering

- Stora touch-vänliga knappar
- Snabb laddning (minimal sida)
- Tydlig feedback vid in/utcheckning
- Fungerar i alla webbläsare

---

### Sammanfattning

**Nya filer:**
- `src/pages/AttendanceScan.tsx`
- `src/components/attendance/QRCodeGenerator.tsx`
- `src/components/attendance/QRCodePrintView.tsx`

**Uppdaterade filer:**
- `src/pages/Attendance.tsx`
- `src/App.tsx`
- `package.json`

**Databasändringar:**
- Ny tabell `attendance_qr_tokens`
- Nytt fält `guest_name` i `attendance_records`

