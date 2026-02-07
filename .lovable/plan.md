
# Plan: Villkorlig visning av navigeringsknappar

## Nuvarande beteende
Alla knappar (Tillbaka, Historik, Refresh, Ny chatt) visas alltid i headern.

## Önskat beteende

| Läge | Vänster sida | Höger sida |
|------|--------------|------------|
| **Tom chatt** | Historik | (inget) |
| **Aktiv chatt** | Tillbaka + Historik | Refresh + Ny chatt |

## Teknisk lösning

Använd befintlig `hasMessages`-variabel för att villkorligt rendera knapparna.

**Fil:** `src/pages/GlobalAssistant.tsx`

```tsx
{/* Header */}
<div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
  <div className="flex items-center gap-2">
    {/* Tillbaka-knapp - endast vid aktiv chatt */}
    {hasMessages && (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(-1)}
        className="h-8 w-8"
        title="Tillbaka"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
    )}
    {/* Historik-knapp - alltid synlig */}
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setHistoryOpen(true)}
      className="h-8 w-8"
      title="Visa historik"
    >
      <History className="h-4 w-4" />
    </Button>
    <Sparkles className="h-4 w-4 text-primary" />
    <span className="text-sm font-medium">Global Assistant</span>
  </div>
  
  {/* Höger sida - endast vid aktiv chatt */}
  {hasMessages && (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.location.reload()}
        className="h-8 w-8"
        title="Uppdatera"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNewChat}
        className="h-8 w-8"
        title="Ny chatt"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )}
</div>
```

## Fil att ändra

| Fil | Ändring |
|-----|---------|
| `src/pages/GlobalAssistant.tsx` | Wrappa Tillbaka-knappen och höger-knapparna med `{hasMessages && (...)}` |

## Resultat

| Tillstånd | Före | Efter |
|-----------|------|-------|
| Tom chatt | [←][📋]✨ ... [↻][+] | [📋]✨ ... |
| Aktiv chatt | [←][📋]✨ ... [↻][+] | [←][📋]✨ ... [↻][+] |
