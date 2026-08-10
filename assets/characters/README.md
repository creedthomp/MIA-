# Character art

Drop character PNGs here (transparent background, ~512px tall), then register
them in `components/game2/PlayerCharacter.tsx`:

```ts
const CHARACTERS: Record<string, number> = {
  rook: require("../../assets/characters/rook.png"),
  // ...
};
```

Assign one to a seat by setting `characterId` on the `TablePlayer` passed into
`GameTable2` (build it from the player's profile/choice). Any seat without a
matching `characterId` renders the filler stick figure automatically.
