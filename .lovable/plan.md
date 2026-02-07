

## Mål

Ta bort "Dagrapporter" från sidomenyn för administratörer, men behålla "Dagbok/Arbetsdagbok"-tabben som fungerar inne i projektvyn.

---

## Nuvarande vs Önskat

| Element | Nuvarande | Efter ändring |
|---------|-----------|---------------|
| Sidomenyn (admin) | Visar "Dagrapporter" | Visar INTE "Dagrapporter" |
| Projekt → Dagbok-tabb | Fungerar | Fungerar (ingen ändring) |
| /daily-reports sida | Tillgänglig | Finns kvar för anställda, men inte i admin-menyn |

---

## Ändringar

### 1. Ta bort "Dagrapporter" från admin-navigeringen

I `src/components/layout/AppLayout.tsx`, rad 66:

```text
FÖRE:
  { label: "Projekt", href: "/projects", icon: FolderKanban, moduleKey: "projects" },
  { label: "Dagrapporter", href: "/daily-reports", icon: BookOpen, moduleKey: "daily-reports" },  // <-- TA BORT
  { label: "Personalliggare", href: "/attendance", icon: ClipboardCheck, moduleKey: "attendance" },

EFTER:
  { label: "Projekt", href: "/projects", icon: FolderKanban, moduleKey: "projects" },
  // Dagrapporter borttagen för admin - använd Dagbok-tabben i projektvyn istället
  { label: "Personalliggare", href: "/attendance", icon: ClipboardCheck, moduleKey: "attendance" },
```

### 2. Behåll för anställda

Anställda behåller sin "Dagrapporter"-länk (rad 55) eftersom de behöver en egen ingång utan att gå via projekt.

---

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `src/components/layout/AppLayout.tsx` | Ta bort rad 66 (Dagrapporter för admin) |

---

## Resultat

- Administratörer ser inte "Dagrapporter" i sidomenyn
- Administratörer använder "Dagbok"-tabben inne i varje projekt
- Anställda behåller sin separata dagrapportsida
- Samma data och funktionalitet, bara olika ingångspunkter baserat på roll

