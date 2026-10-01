# Card art

What Mario House Party loads for each card. Every path below is built by
`getCardImagePath` in `src/app/mario-house-party/card-images.ts`, so these file
names are not a suggestion — a card whose file is missing falls back to a drawn
card with its name and value instead.

**73 files in five folders.** Names are case-sensitive once deployed.

## Format

The art arrived as 750x1050 PNGs averaging 887 KB, which is 63 MB in total and
around 19 MB for one visit to the score calculator. It ships here as **400x560
WebP at quality 90** instead: 3.4 MB in total, indistinguishable at the size
the cards are drawn, and about 70 KB each.

400x560 is twice the largest a card is ever drawn — the rules dialog shows one
at 200px wide, and the board draws them at 80 to 160px. Cards are plain `<img>`
tags, so what is in this folder is what the browser downloads.

To replace one, match the name exactly and keep the 5:7 portrait shape. The art
runs edge to edge: the rounded corners and the GOLDEN, TAPPED, HIDDEN and
"Cannot Cancel" badges are painted over it by the app. If you swap the
extension back to `.png`, change it in `card-images.ts` and in the `fileName`
of each monster and power-up in `card-data.ts`.

Two naming quirks, kept from the original export:

- Power-ups keep the bare numbers they were imported with (`112.webp`), not
  their names.
- Every monster is prefixed `M-` except Bob-omb, which is just `Bob-omb.webp`.


## `public/cards/collectables/` — 13 files

House code, then the card's point value; the `-5` is the golden one. `MysteryBox` is the single mystery box.

| File | Card |
| --- | --- |
| `CH-1.webp` | mario-bros 1pt |
| `CH-2.webp` | mario-bros 2pt |
| `CH-3.webp` | mario-bros 3pt |
| `CH-5.webp` | mario-bros golden 5pt |
| `KC-1.webp` | kong-island 1pt |
| `KC-2.webp` | kong-island 2pt |
| `KC-3.webp` | kong-island 3pt |
| `KC-5.webp` | kong-island golden 5pt |
| `MC-1.webp` | mushroom-kingdom 1pt |
| `MC-2.webp` | mushroom-kingdom 2pt |
| `MC-3.webp` | mushroom-kingdom 3pt |
| `MC-5.webp` | mushroom-kingdom golden 5pt |
| `MysteryBox.webp` | mystery box |

## `public/cards/heroes/` — 26 files

House code, then the character, exactly as spelled in `card-library.ts` (no spaces).

| File | Card |
| --- | --- |
| `BC-Bowser.webp` | bowsers-castle hero Bowser |
| `BC-Kamek.webp` | bowsers-castle hero Kamek |
| `BC-Kammy.webp` | bowsers-castle hero Kammy |
| `BC-KingBoo.webp` | bowsers-castle hero KingBoo |
| `BC-KoopaKids.webp` | bowsers-castle hero KoopaKids |
| `BC-PeteyPiranha.webp` | bowsers-castle hero PeteyPiranha |
| `CH-BabyMarios.webp` | mario-bros hero BabyMarios |
| `CH-EGadd.webp` | mario-bros hero EGadd |
| `CH-Luigi.webp` | mario-bros hero Luigi |
| `CH-Mario.webp` | mario-bros hero Mario |
| `CH-Rosalina.webp` | mario-bros hero Rosalina |
| `CH-Yoshi.webp` | mario-bros hero Yoshi |
| `KC-Cranky.webp` | kong-island hero Cranky |
| `KC-DiddyKong.webp` | kong-island hero DiddyKong |
| `KC-Dixie.webp` | kong-island hero Dixie |
| `KC-DonkeyKong.webp` | kong-island hero DonkeyKong |
| `KC-Funky.webp` | kong-island hero Funky |
| `KC-Pauline.webp` | kong-island hero Pauline |
| `MC-Birdo.webp` | mushroom-kingdom hero Birdo |
| `MC-Daisy.webp` | mushroom-kingdom hero Daisy |
| `MC-Peach.webp` | mushroom-kingdom hero Peach |
| `MC-Toad.webp` | mushroom-kingdom hero Toad |
| `MC-Toadette.webp` | mushroom-kingdom hero Toadette |
| `MC-Toadsworth.webp` | mushroom-kingdom hero Toadsworth |
| `WA-Waluigi.webp` | wa hero Waluigi |
| `WA-Wario.webp` | wa hero Wario |

## `public/cards/monsters/` — 8 files

From each monster's `fileName` in `card-data.ts`.

| File | Card |
| --- | --- |
| `Bob-omb.webp` | monster Bob-omb (-10) |
| `M-BigBoo.webp` | monster Big Boo (-2) |
| `M-Boo.webp` | monster Boo (-1) |
| `M-DryBones.webp` | monster Dry Bones (-3) |
| `M-Goomba.webp` | monster Goomba (-1) |
| `M-KoopaParatroopa.webp` | monster Koopa Paratroopa (-2) |
| `M-KoopaTroopa.webp` | monster Koopa Troopa (-1) |
| `M-ShyGuy.webp` | monster Shy Guy (-2) |

## `public/cards/powerups/` — 13 files

The numbers these were imported under, from `POWERUP_CARDS`.

| File | Card |
| --- | --- |
| `112.webp` | power-up Fire Flower |
| `121.webp` | power-up Ice Flower |
| `130.webp` | power-up Piranha Plant |
| `136.webp` | power-up Warp Pipe |
| `142.webp` | power-up Thwomp |
| `154.webp` | power-up 1 Up Mushroom |
| `155.webp` | power-up Star Power |
| `156.webp` | power-up Blue Shell |
| `157.webp` | power-up K.O. Hammer |
| `158.webp` | power-up Lakitu |
| `159.webp` | power-up Tanuki Suit |
| `160.webp` | power-up Red Shells |
| `161.webp` | power-up Gold Pipe |

## `public/cards/trophies/` — 13 files

The four house cups, then the nine +5 trophies.

| File | Card |
| --- | --- |
| `BC-HouseCup.webp` | trophy Koopa Cup |
| `BowsersCastle.webp` | trophy BowsersCastle |
| `CH-HouseCup.webp` | trophy Mario Bros Plumbing Cup |
| `KC-HouseCup.webp` | trophy Kong Island Cup |
| `KoopaBeach.webp` | trophy KoopaBeach |
| `LuigisMansion.webp` | trophy LuigisMansion |
| `MC-HouseCup.webp` | trophy Mushroom Kingdom Cup |
| `MarioFirstPlace.webp` | trophy MarioFirstPlace |
| `PeachsCastle.webp` | trophy PeachsCastle |
| `RainbowRoad.webp` | trophy RainbowRoad |
| `ToadsTurnpike.webp` | trophy ToadsTurnpike |
| `WariosStadium.webp` | trophy WariosStadium |
| `YoshisIsland.webp` | trophy YoshisIsland |

House codes: `CH` Mario Bros Plumbing, `MC` Mushroom Kingdom, `KC` Kong
Island, `BC` Bowser's Castle, `WA` Wa! (wild).
