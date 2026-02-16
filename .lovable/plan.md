

## Byt inbjudningslankens doman till byggio.io

### Vad andras

En enda rad i `src/components/settings/EmployeeManager.tsx` dar `baseUrl` satts till `"https://daglig-rad.lovable.app"`. Den byts till `"https://byggio.io"`.

### Teknisk detalj

| Fil | Rad | Fran | Till |
|-----|-----|------|------|
| `src/components/settings/EmployeeManager.tsx` | 153 | `baseUrl: "https://daglig-rad.lovable.app"` | `baseUrl: "https://byggio.io"` |

Efter andringen kommer inbjudningslankar se ut som: `https://byggio.io/accept-invitation?token=abc123...`

### Forutsattning

Domanen `byggio.io` maste vara kopplad till projektet och aktiv (status "Active") i Lovable. Om den inte ar det annu sa kommer lankarna inte fungera forran DNS-konfigurationen ar klar.

