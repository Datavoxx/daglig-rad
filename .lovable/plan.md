# 📱 Mobil-audit — Byggio @ 390×844

Auditen är gjord live i preview, iPhone-bredd, inloggad användare. Genomgångna vyer: `/dashboard`, `/projects`, `/projects/:id` (Översikt + ÄTA), `/estimates`, `/time-reporting`, `/invoices`, `/customers`.

---

## Övergripande betyg per område

| Område | Betyg | Kommentar |
|---|---|---|
| Navigation (header + sidebar) | 6/10 | Logout-ikon för prominent. BottomNav syns inte. |
| Dashboard | 8.5/10 | Quick-tiles funkar perfekt mobilt |
| Projektlista | 9/10 | Pipeline + kort = bra |
| Projektdetalj (tabs) | 5/10 | Ikon-only tabs utan labels |
| ÄTA-tab | 4/10 | Tabell scrollar horisontellt, knappar klippta |
| Offertlista | 8/10 | Toolbar (Importera/Artiklar/Kategorier) skrollar utanför kanten |
| EstimateBuilder | 3/10 | I praktiken oanvändbar mobilt |
| Tidrapportering | 7.5/10 | MobileDayList bra, men page-header trasig |
| Fakturor | 5/10 | Ikon-only tabs utan text gör syftet okänt |
| Kunder | 9/10 | Kort, sök, kategori-badge — rent |

**Totalt: 6.5/10** — Listvyer är solida. Allt som har tabs, tabeller eller toolbars havererar.

---

## 🔴 Kritiska problem (måste fixas)

### 1. BottomNav syns aldrig på mobil
På samtliga sidor jag besökte (390×844) fanns ingen bottenmeny. `BottomNav.tsx` har korrekt `md:hidden` men `visibleItems = navItems.filter(hasAccess).slice(0,5)` — om `useUserPermissions` returnerar tom array initialt får man 0 items och rendrar tom `<nav>`. Detta gör att hela mobil-navigationen försvinner och användaren måste öppna hamburger-menyn varje gång.

**Trolig orsak:** `hasAccess` returnerar `false` tills permissions hunnit ladda → tom array. Bör default:a till `true` medan loading, eller visa core-items utan permission-check.

### 2. Tabs på mobil saknar text (Invoices + ProjectView)
- `/invoices`: Tre ikoner (sedel/lastbil/kamera). Användaren kan inte gissa "lastbil = leverantörsfaktura".
- `/projects/:id`: Sex ikoner i rad utan label.

Fix: Visa **förkortad** text under varje ikon, eller åtminstone första aktiva tabben.

### 3. ÄTA-tabellen overflows + knappar klippta
- Tabellen i ÄTA-tabben har horisontell scroll med 3 kolumner ("ÄTA-nr", "Artikel", "Beskrivning") — och fler dolda till höger.
- Knappen "Ny ÄTA" är klippt vid höger kant.
- "Exportera PDF" + "Ny ÄTA" + header-titel ligger i samma rad utan wrap.

Fix: Mobil = kortvy per ÄTA (samma mönster som MobileDayList), inte tabell. Header-actions ska wrappa.

### 4. EstimateBuilder är fundamentalt desktop-only
Inget specifikt mobilläge — användaren får pinch-zoom + horisontell scroll. För en byggchef i bilen är detta oanvändbart. Detta är samma punkt som tidigare audit, men kvarstår.

### 5. Page-header staplas dåligt på TimeReporting + Estimates
- `/time-reporting`: "Löneexport" + "Rapportera" (klippt → "Re...") ligger på samma rad som titeln. Knapp klippt.
- `/estimates`: "Importera / Artiklar / Kategorier" skrollar horisontellt utanför viewport. Användaren ser inte att det finns mer.

Fix: Action-knappar under titeln (stack) på `< md`, eller dropdown "•••" på mobil.

---

## 🟡 Medel-problem

### 6. Header — Logout-ikon för prominent
Röd logout-ikon mellan logo och avatar är **lättare att råka klicka** än hamburger-menyn. Den borde antingen ligga i avatar-dropdownen (standard mönster) eller åtminstone vara gråtonad tills man trycker på avataren.

### 7. Hero-sektioner äter skärm
`/invoices` har en stor "Fakturor / Hantera kund- och leverantörsfakturor"-hero (~130px) plus tabs (~50px) plus sök (~50px) plus filter (~50px) **innan** första rad. På 844px har man förbrukat ~280px (33%) på chrome. Krymp hero på mobil (eller släng den, titel räcker).

### 8. Toast/Sonner-placering
Toast hamnar nere till höger som default. När BottomNav återkommer (efter fix #1) kan toast krocka. Verifiera `safe-bottom` + 80px offset.

### 9. Inga gestures
- Ingen pull-to-refresh på listor (projekt, fakturor, kunder, tid).
- Inga swipe-to-delete på rader.
- Inga swipe-mellan-tabs.

Inte kritiskt men förväntat av "app-känsla".

### 10. Globala Assistant-knappen
Floating chat-bubble (om aktiv) ligger nere till höger och krockar med BottomNav + JobActionBar — tre lager på samma 80px-band.

---

## 🟢 Mindre justeringar

- Avatar-cirkeln i header har bara initial "I" (ingen tap-feedback).
- `/projects` projektkort: "Gullmarsplan, Johann..." trunkeras med ellipsis men inget tooltip — på mobil = osynlig info.
- KPI-kort på dashboard ("Personal på plats — 0 just nu") med opacity 0.5 är otillgänglig (kontrast under WCAG AA).
- Hamburger-menyn (Sheet) öppnas snabbt men har ingen safe-area-padding upptill på iOS notch.

---

## 📋 Rekommenderad åtgärdslista (prioriterad)

| # | Åtgärd | Effort | Impact |
|---|---|---|---|
| 1 | Fixa BottomNav-rendering vid permissions-load | S | 🔴 Kritisk |
| 2 | Lägg labels under tabs-ikoner mobilt (Invoices + ProjectView) | S | 🔴 Hög |
| 3 | ÄTA mobilvy: kort istället för tabell + wrappa header-actions | M | 🔴 Hög |
| 4 | Stack page-headers (titel + actions) på mobil | S | 🟡 Medium |
| 5 | Krymp Hero-sektioner till 64px på mobil | S | 🟡 Medium |
| 6 | Flytta Logout till avatar-dropdown | S | 🟡 Medium |
| 7 | EstimateBuilder kortvy mobilt (en rad i taget) | L | 🔴 Hög |
| 8 | Pull-to-refresh på listor | M | 🟢 Låg |
| 9 | Verifiera Toast/Assistant z-index vs BottomNav | S | 🟢 Låg |
| 10 | Fixa opacity-0.5 kontrast på KPI-kort | XS | 🟢 Låg |

---

## Slutsats

**Fältdelen** (tid, dagbok, kvitto, jobb, kundlista) är mobiloptimerad. **Kontorsdelen** (offert, ÄTA, fakturor med dolda tabs) är fortfarande desktop-tänkt.

Den enskilt största "felet" just nu är att **BottomNav inte syns** — det gör att en mobil-användare måste öppna hamburger-menyn för varje navigation, vilket dödar app-känslan. Det är en S-fix och bör göras först.

**Vill du att jag bygger fix #1–#6 i ordning?** Det skulle lyfta plattformen från 6.5 → 8.5 utan att röra EstimateBuilder.
