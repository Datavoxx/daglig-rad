

## Fix hamburgarmenyn: slide-in fran vanster istallet for "pop"

### Problem
Hamburgarmenyn poppar bara upp istallet for att glida in fran vanster. Orsaken ar att knappen inte ar inkapslad i `SheetTrigger`, sa Radix Dialog missar open-animationen.

### Losning
Wrappa hamburgarknappen i `SheetTrigger` istallet for att anvanda en manuell `onClick` + `setMobileMenuOpen(true)`. Da kopplas oppningen korrekt till Radix-animationssystemet och slide-in-from-left-animationen spelar som den ska.

### Teknisk andring

**`src/components/layout/AppLayout.tsx`** (rad ~288-296)

Andra fran:
```tsx
<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
  <Button 
    variant="ghost" 
    size="icon" 
    className="h-9 w-9"
    onClick={() => setMobileMenuOpen(true)}
  >
    <Menu className="h-5 w-5" />
  </Button>
```

Till:
```tsx
<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
  <SheetTrigger asChild>
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9"
    >
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
```

Kontrollera aven att `SheetTrigger` ar importerad langst upp i filen (den importeras redan troligen via sheet-komponenten).

En enda fil andras, en minimal andring.
