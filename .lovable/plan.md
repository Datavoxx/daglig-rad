

## Snabbrutor pa mobil-dashboarden

### Vad andras
Pa mobilvyn (under 768px) ersatts den nuvarande "Byggio AI"-chattwidgeten med ett rutsystem med snabblankar. Desktop och iPad behaller nuvarande layout helt oforandrad.

### Rutor som visas (mobil)
| Ruta | Ikon | Lankar till |
|------|------|-------------|
| Byggio AI | Sparkles | /global-assistant |
| Offert | Calculator | /estimates |
| Projekt | FolderKanban | /projects |
| Personalliggare | ClipboardCheck | /attendance |
| Tidsrapport | Clock | /time-reporting |
| Kunder | Users | /customers |
| Kvitto | Receipt | /invoices (ny funktion, lankar tillfalligt till fakturor) |

Rutorna visas i ett 2-kolumns grid med jamn storlek, med ikon och text i varje ruta. De far en subtil bakgrund och ar klickbara.

### Teknisk andring

**`src/pages/Dashboard.tsx`**

1. Importera `useIsMobile` fran `@/hooks/use-mobile`.
2. Runt `<DashboardAssistantWidget />` (rad 364-365): wrappa i en villkorlig rendering:
   - Om `isMobile`: rendera ett nytt `MobileQuickGrid`-rutsystem med de 7 rutorna ovan.
   - Om inte mobil: rendera `<DashboardAssistantWidget />` som vanligt.
3. Det nya gridet byggs inline i Dashboard-komponenten (inget nytt komponentfil behovs) med `grid grid-cols-2 gap-3` och varje ruta ar en klickbar `div` med ikon + text.

**Ingen andring pa desktop/iPad** -- allt forblir exakt som det ar pa skarmbredder over 768px.

### Filpavekan
| Fil | Andring |
|-----|---------|
| `src/pages/Dashboard.tsx` | Lagg till `useIsMobile`, visa rutsystem istallet for AI-widget pa mobil |

