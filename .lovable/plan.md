

## Lägg till Enter-stöd på alla formulär

### Översikt

Implementera tangentbords-Enter-stöd på 4 formulär som saknar det. När användaren fyller i uppgifter och trycker Enter ska formuläret sparas/skickas automatiskt utan att behöva klicka med musen.

### Filer som påverkas

| Fil | Nuläge | Ändring |
|-----|--------|---------|
| `src/components/customers/CustomerFormDialog.tsx` | `onClick` på spara-knapp | Wrap i `<form>` + `onSubmit` |
| `src/components/invoices/CustomerInvoiceDialog.tsx` | `onClick` på spara-knappar | Wrap i `<form>` + `onSubmit` |
| `src/components/invoices/VendorInvoiceDialog.tsx` | `onClick` på spara-knapp | Wrap i `<form>` + `onSubmit` |
| `src/pages/Profile.tsx` | `onClick` på spara-knapp | Wrap i `<form>` + `onSubmit` |

### Implementation

#### 1. CustomerFormDialog.tsx

Wrap formulärinnehållet i en `<form>` och ändra spara-knappen till `type="submit"`:

```typescript
// Före (rad 207-369):
<div className="space-y-4 py-4">
  {/* formulärfält */}
</div>
<DialogFooter>
  <Button onClick={handleSave}>Spara</Button>
</DialogFooter>

// Efter:
<form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
  <div className="space-y-4 py-4">
    {/* formulärfält */}
  </div>
  <DialogFooter>
    <Button type="button" variant="outline" onClick={() => handleClose(false)}>
      Avbryt
    </Button>
    <Button type="submit" disabled={saving}>
      Spara
    </Button>
  </DialogFooter>
</form>
```

#### 2. CustomerInvoiceDialog.tsx

Samma mönster - wrap ScrollArea-innehållet och action-knapparna i en `<form>`:

```typescript
// Ändra så "Spara utkast" blir type="submit" (default action vid Enter)
<form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate("draft"); }}>
  <ScrollArea>...</ScrollArea>
  <div className="flex gap-2">
    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
    <Button type="submit">Spara utkast</Button>
    <Button type="button" onClick={() => saveMutation.mutate("sent")}>Markera som skickad</Button>
  </div>
</form>
```

#### 3. VendorInvoiceDialog.tsx

Wrap innehållet i en `<form>` med spara som submit:

```typescript
<form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
  <ScrollArea>...</ScrollArea>
  <div className="flex gap-2">
    <Button type="button" variant="outline">Avbryt</Button>
    <Button type="submit">Spara ändringar</Button>
  </div>
</form>
```

#### 4. Profile.tsx

Wrap personlig information-formuläret i en `<form>`:

```typescript
// Ändra CardContent (rad 268-331) till:
<form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
  <CardContent className="space-y-6">
    {/* input fields */}
    <Button type="submit" disabled={saving || !hasChanges}>
      Spara ändringar
    </Button>
  </CardContent>
</form>
```

### Tekniska detaljer

**Mönstret som används:**
1. Wrap alla input-fält och submit-knappen i ett `<form>`-element
2. Lägg till `onSubmit={(e) => { e.preventDefault(); handleSave(); }}`
3. Ändra primär spara-knapp till `type="submit"`
4. Behåll avbryt/sekundära knappar som `type="button"` för att förhindra oavsiktlig submit

**Fördelar:**
- Nativt webbläsarbeteende - Enter triggar submit
- Tillgängligt för tangentbordsnavigation
- Konsekvent UX genom hela appen

