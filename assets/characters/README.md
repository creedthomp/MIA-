# Character art

Seats render a rectangular **portrait frame** (poker-app style, ~54×58 shown);
the character is cover-fit and clipped inside it, so art should be a
**head-and-shoulders bust crop** on a transparent background (~512px tall).

To wire art in, register it in `components/game2/PlayerCharacter.tsx`:

```ts
const CHARACTERS: Record<string, number> = {
  rook: require("../../assets/characters/rook.png"),
  // ...
};
```

Assign one to a seat by setting `characterId` on the `TablePlayer` passed into
`GameTable2` (build it from the player's profile/choice). Any seat without a
matching `characterId` renders the filler bust silhouette automatically.
