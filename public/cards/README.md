# Card art

Where Mario House Party looks for its card images. Every path below is built
by `getCardImagePath` in `src/app/mario-house-party/card-images.ts`, so the
file names are not a suggestion — a card whose file is missing falls back to a
drawn card with its name and value instead.

**73 files in five folders.** Names are case-sensitive once deployed.

Export portrait PNGs: cards render at up to 160x220 CSS pixels with
`object-fit: cover`, so roughly 320x440 (an 8:11 portrait) covers a retina
screen with nothing to spare. The art is drawn edge to edge — the rounded
corners and the golden/tapped/hidden badges are painted over it by the app.

Two naming quirks worth catching before you export:

- Power-ups keep the bare numbers they were imported with (`112.png`), not
  their names.
- Every monster is prefixed `M-` except Bob-omb, which is just `Bob-omb.png`.


## `public/cards/collectables/` — 13 files

House code, then the card's point value; `-5` is the golden one. `MysteryBox.png` is the single mystery box.

| File | Card |
| --- | --- |
| `CH-1.png` | mario-bros 1pt |
| `CH-2.png` | mario-bros 2pt |
| `CH-3.png` | mario-bros 3pt |
| `CH-5.png` | mario-bros golden 5pt |
| `KC-1.png` | kong-island 1pt |
| `KC-2.png` | kong-island 2pt |
| `KC-3.png` | kong-island 3pt |
| `KC-5.png` | kong-island golden 5pt |
| `MC-1.png` | mushroom-kingdom 1pt |
| `MC-2.png` | mushroom-kingdom 2pt |
| `MC-3.png` | mushroom-kingdom 3pt |
| `MC-5.png` | mushroom-kingdom golden 5pt |
| `MysteryBox.png` | mystery box |

## `public/cards/heroes/` — 26 files

House code, then the character, exactly as spelled in `card-library.ts` (no spaces).

| File | Card |
| --- | --- |
| `BC-Bowser.png` | bowsers-castle hero Bowser |
| `BC-Kamek.png` | bowsers-castle hero Kamek |
| `BC-Kammy.png` | bowsers-castle hero Kammy |
| `BC-KingBoo.png` | bowsers-castle hero KingBoo |
| `BC-KoopaKids.png` | bowsers-castle hero KoopaKids |
| `BC-PeteyPiranha.png` | bowsers-castle hero PeteyPiranha |
| `CH-BabyMarios.png` | mario-bros hero BabyMarios |
| `CH-EGadd.png` | mario-bros hero EGadd |
| `CH-Luigi.png` | mario-bros hero Luigi |
| `CH-Mario.png` | mario-bros hero Mario |
| `CH-Rosalina.png` | mario-bros hero Rosalina |
| `CH-Yoshi.png` | mario-bros hero Yoshi |
| `KC-Cranky.png` | kong-island hero Cranky |
| `KC-DiddyKong.png` | kong-island hero DiddyKong |
| `KC-Dixie.png` | kong-island hero Dixie |
| `KC-DonkeyKong.png` | kong-island hero DonkeyKong |
| `KC-Funky.png` | kong-island hero Funky |
| `KC-Pauline.png` | kong-island hero Pauline |
| `MC-Birdo.png` | mushroom-kingdom hero Birdo |
| `MC-Daisy.png` | mushroom-kingdom hero Daisy |
| `MC-Peach.png` | mushroom-kingdom hero Peach |
| `MC-Toad.png` | mushroom-kingdom hero Toad |
| `MC-Toadette.png` | mushroom-kingdom hero Toadette |
| `MC-Toadsworth.png` | mushroom-kingdom hero Toadsworth |
| `WA-Waluigi.png` | wa hero Waluigi |
| `WA-Wario.png` | wa hero Wario |

## `public/cards/monsters/` — 8 files

From each monster's `fileName` in `card-data.ts`.

| File | Card |
| --- | --- |
| `Bob-omb.png` | monster Bob-omb (-10) |
| `M-BigBoo.png` | monster Big Boo (-2) |
| `M-Boo.png` | monster Boo (-1) |
| `M-DryBones.png` | monster Dry Bones (-3) |
| `M-Goomba.png` | monster Goomba (-1) |
| `M-KoopaParatroopa.png` | monster Koopa Paratroopa (-2) |
| `M-KoopaTroopa.png` | monster Koopa Troopa (-1) |
| `M-ShyGuy.png` | monster Shy Guy (-2) |

## `public/cards/powerups/` — 13 files

The numbers these were imported under, from `POWERUP_CARDS`.

| File | Card |
| --- | --- |
| `112.png` | power-up Fire Flower |
| `121.png` | power-up Ice Flower |
| `130.png` | power-up Piranha Plant |
| `136.png` | power-up Warp Pipe |
| `142.png` | power-up Thwomp |
| `154.png` | power-up 1 Up Mushroom |
| `155.png` | power-up Star Power |
| `156.png` | power-up Blue Shell |
| `157.png` | power-up K.O. Hammer |
| `158.png` | power-up Lakitu |
| `159.png` | power-up Tanuki Suit |
| `160.png` | power-up Red Shells |
| `161.png` | power-up Gold Pipe |

## `public/cards/trophies/` — 13 files

The four house cups, then the nine +5 trophies.

| File | Card |
| --- | --- |
| `BC-HouseCup.png` | trophy Koopa Cup |
| `BowsersCastle.png` | trophy BowsersCastle |
| `CH-HouseCup.png` | trophy Mario Bros Plumbing Cup |
| `KC-HouseCup.png` | trophy Kong Island Cup |
| `KoopaBeach.png` | trophy KoopaBeach |
| `LuigisMansion.png` | trophy LuigisMansion |
| `MC-HouseCup.png` | trophy Mushroom Kingdom Cup |
| `MarioFirstPlace.png` | trophy MarioFirstPlace |
| `PeachsCastle.png` | trophy PeachsCastle |
| `RainbowRoad.png` | trophy RainbowRoad |
| `ToadsTurnpike.png` | trophy ToadsTurnpike |
| `WariosStadium.png` | trophy WariosStadium |
| `YoshisIsland.png` | trophy YoshisIsland |

House codes: `CH` Mario Bros Plumbing, `MC` Mushroom Kingdom, `KC` Kong
Island, `BC` Bowser's Castle, `WA` Wa! (wild).
