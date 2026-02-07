

## Mål

Öka hastigheten på den roterande texten i hero-sektionen på landing-sidan.

---

## Nuvarande timing

| Parameter | Nuvarande värde | Effekt |
|-----------|----------------|--------|
| `setInterval` | 2500ms | Tid mellan varje ordväxling |
| `setTimeout` (fade-ut → fade-in) | 300ms | Hur snabbt fade-animationen sker |
| CSS `transition-all duration-300` | 300ms | CSS-animationens längd |

---

## Förslag på ny timing

| Parameter | Nytt värde | Effekt |
|-----------|------------|--------|
| `setInterval` | **1800ms** | Snabbare byte (~1,8 sekunder per ord) |
| `setTimeout` | **200ms** | Snabbare fade |
| CSS `duration-200` | **200ms** | Matchar JS-timing |

Detta ger en **~40% snabbare** ordväxling.

---

## Teknisk ändring

**Fil:** `src/components/landing/HeroSection.tsx`

### Rad 31-39 (useEffect)
```typescript
// Nuvarande:
}, 2500);  // ← Ändra till 1800

// setTimeout:
}, 300);   // ← Ändra till 200
```

### Rad 61 (CSS-klass)
```typescript
// Nuvarande:
transition-all duration-300

// Ny:
transition-all duration-200
```

---

## Alternativa hastigheter

Om 1800ms känns för snabbt eller för långsamt:

| Känsla | Interval | Fade |
|--------|----------|------|
| Snabbare | 1500ms | 150ms |
| Lagom snabbare | 1800ms | 200ms |
| Lite snabbare | 2000ms | 250ms |

---

## Sammanfattning

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `src/components/landing/HeroSection.tsx` | Ändra interval till 1800ms, setTimeout till 200ms, och duration till 200ms |

