# BLONS — a ROUNDS-style 2D duel for Roblox

A Roblox recreation of the core gameplay loop of [ROUNDS](https://store.steampowered.com/app/1557740/ROUNDS/):

- **2D side-view 1v1** — characters are locked to a flat plane with a cinematic side camera that frames both fighters and zooms with the action.
- **Lose a round, gain an upgrade** — the loser of every round picks 1 of 3 random cards from a pool of **38 upgrades** (buckshot, bouncy bullets, homing, vampirism, explosive rounds, double jump, thorns, second wind, and many more). Cards stack across rounds, so builds snowball.
- **First to 3 round wins** takes the match, then a fresh match starts with clean stat sheets.
- **5 handcrafted maps** (Highlands, The Pit, Ziggurat, Skyline, Canyon) that rotate every round.
- **ROUNDS-style block** — a shield burst on a cooldown that deletes incoming bullets and grants brief invulnerability. Some cards enhance it.

## Controls (desktop)

| Input | Action |
| --- | --- |
| A / D | Move |
| Space | Jump (extra jumps with Rocket Boots) |
| Mouse | Aim |
| Left click (hold) | Shoot |
| F or Right click | Block |

## Project structure

```
default.project.json      Rojo project mapping
src/
  shared/                 -> ReplicatedStorage.Shared
    Config.lua            Match rules + base stat sheet
    Upgrades.lua           The 38-card upgrade pool
    Maps.lua              The 5 arena layouts
  server/                 -> ServerScriptService.Server
    Main.server.lua       Match director, combat, damage, blocking, upgrade offers
    MapBuilder.lua        Builds arenas from map definitions
    PlayerStats.lua       Per-fighter stat sheets, upgrade application
    Projectiles.lua       Server-authoritative bullet simulation
  client/                 -> StarterPlayerScripts.Client
    Main.client.lua       2D plane lock, side camera, input, HUD, card picker
```

## How to run it

### Option A — Rojo (recommended)

1. Install [Rojo](https://rojo.space/) (CLI + the Roblox Studio plugin).
2. From the repo root run `rojo serve`, then in Studio hit **Connect** in the Rojo plugin.
3. Use Studio's **Test → Clients and Servers → 2 players** to start a local 2-player playtest.

You can also build a place file directly: `rojo build -o blons-rounds.rbxlx` and open it in Studio.

### Option B — manual paste

1. In Roblox Studio, create folder `ReplicatedStorage/Shared` and add `Config`, `Upgrades`, `Maps` as **ModuleScripts** with the contents of `src/shared/`.
2. Create folder `ServerScriptService/Server`; add `MapBuilder`, `PlayerStats`, `Projectiles` as **ModuleScripts** and `Main` as a **Script**, from `src/server/`.
3. Create folder `StarterPlayer/StarterPlayerScripts/Client`; add `Main` as a **LocalScript** from `src/client/`.

## How a match flows

1. The server waits for 2 players, then pairs the first two as fighters (extra players spectate).
2. Each round: the next map in rotation is built, both fighters spawn at opposite ends, a 3-second countdown freezes them, then it's live.
3. A fighter dies (health hits 0 or they fall into the pit) → the other fighter scores a point.
4. The **loser** is offered 3 random upgrade cards and picks one (auto-picks after 20 s).
5. Repeat until someone reaches **3 wins** — they take the match, everyone's build resets, and a new match begins.

All combat is server-authoritative: the client only sends aim points and button presses; the server owns cooldowns, ammo, bullet physics, damage, and blocking.
