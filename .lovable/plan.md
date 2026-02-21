
## Fixa dialog-bredd pa mobil (kvitto-dialoger)

### Problem
Bade "Nytt kvitto"-dialogen och kvittodetaljdialogen stracker sig fran kant till kant pa mobilen -- ingen marginal, inga rundade horn. Det ser klumpigt ut och okar risken for felklick.

### Losning
Lagg till horisontell marginal och rundade horn pa mobil i den globala `DialogContent`-komponenten (`src/components/ui/dialog.tsx`).

### Teknisk andring

**`src/components/ui/dialog.tsx`** (rad 39)

Andra fran:
```
w-full max-w-lg ... sm:rounded-lg
```

Till:
```
w-[calc(100%-2rem)] max-w-lg ... rounded-lg
```

- `w-[calc(100%-2rem)]` ger 1rem (16px) marginal pa vardera sida, sa dialogen aldrig gar anda ut till kanterna.
- `rounded-lg` appliceras alltid (inte bara pa `sm:`) sa att rundade horn syns aven pa mobil.

Detta paverkar alla dialoger i appen men ar en forbattring overallt -- inte bara for kvitto.
