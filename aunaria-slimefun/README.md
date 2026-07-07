# Aunaria Slimefun 2.0 — Hytale Plugin

> Next-generation automation and magic plugin for the Aunaria Hytale server · Walker Crew Studio

[![Java](https://img.shields.io/badge/Java-25-ed8b00?style=flat-square&logo=java)](https://jdk.java.net/25)
[![Hytale](https://img.shields.io/badge/Hytale-Early%20Access-7b52f4?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](#)

A complete reimagining of Slimefun for Hytale. Instead of outdated multiblock machines with chest-slot GUIs, Aunaria Slimefun 2.0 features **3D machine models**, **graphical Hytale-native UIs**, a **research tree**, and an interconnected **energy network** — all built on Hytale's ECS architecture.

## What's Different from Minecraft Slimefun

| Classic Slimefun | Aunaria Slimefun 2.0 |
|-----------------|----------------------|
| Multiblock machines | 3D `.blockymodel` machines |
| Chest-slot GUIs | Hytale native `.ui` pages |
| Bukkit events | Hytale ECS event systems |
| Energy via capacitors only | Networked energy grid (BFS topology) |
| No magic tier | Magical research tree (Mana Crystals, Soul Embers) |
| Single energy unit | Dual system: Joules (electric) + Mana (magical) |

## Machines

### Technology Tier
| Machine | Energy | Description |
|---------|--------|-------------|
| Enhanced Crafting Table | — | Base station for all SF 2.0 crafting |
| Electric Furnace | 24 J/tick | Smelts 2× faster, processes SF materials |
| Ore Washer | 18 J/tick | 2–3× ore yield + rare byproducts |
| Coal Generator | Produces 16 J/tick | Burns coal/wood for energy |
| Solar Generator | Produces 6 J/tick | Daylight-only energy |
| Energy Capacitor | Storage 1024 J | Network buffer |

### Magic Tier
| Machine | Type | Description |
|---------|------|-------------|
| Magic Workbench | Mana catalyst | Tier 1–2 magical items |
| Alchemist's Cauldron | Heat system | Elixirs, potions, essences |
| Arcane Forge | 96 J/tick + Mana | Tier 3 void alloys, soul steel |
| Crystal Infuser | 48 J/tick | Crystal-type based transformation |

## Research Tree

```
sf_basic_tech (free)
    └── sf_electrical_machines (150 XP)
            └── sf_advanced_processing (200 XP)
                    ├── sf_industrial_automation (500 XP)
                    └── sf_arcane_arts (350 XP)
                                └── sf_arcane_mastery (800 XP)
```

## Energy Network

Machines connect automatically when placed adjacent to each other. The network uses BFS topology to merge/split when machines are placed or removed.

```
[Coal Generator 16J/t] ─┐
[Solar Generator  6J/t] ├─ EnergyNetwork ─→ [Electric Furnace 24J/t]
[Energy Capacitor 1024J]─┘                   [Ore Washer      18J/t]
```

## Commands

| Command | Description |
|---------|-------------|
| `/sf guide` | Browse all items by category |
| `/sf research` | View and unlock research tree |
| `/sf research unlock <id>` | Contribute XP to research |
| `/sf machines` | List active machines in world |
| `/sf info <id>` | Machine/item details and recipes |
| `/sf admin unlock <researchId>` | Force-unlock (admin only) |

## Building

```bash
# Prerequisites: Java 25 JDK, Hytale Server JAR

# 1. Place HytaleServer.jar in libs/
mkdir libs
cp /path/to/HytaleServer.jar libs/

# 2. Build shadow JAR
./gradlew shadowJar

# Output: build/libs/aunaria-slimefun-1.0.0.jar
```

## Installation

1. Copy `aunaria-slimefun-1.0.0.jar` to your Hytale server's `plugins/` folder
2. Restart the server
3. Plugin auto-registers all machines, research, and energy networks

## Project Structure

```
aunaria-slimefun/
├── build.gradle
├── src/main/
│   ├── java/studio/walkercrew/aunaria/slimefun/
│   │   ├── SlimefunPlugin.java          Main plugin class
│   │   ├── core/                        Registry, SlimefunItem
│   │   ├── research/                    Research tree + ECS persistence
│   │   ├── energy/                      Network topology, tick distribution
│   │   ├── machine/                     AbstractMachine, recipes, state
│   │   ├── gui/                         Hytale .ui page system
│   │   ├── implementations/
│   │   │   ├── machines/                ECT, ElectricFurnace, OreWasher
│   │   │   ├── generators/              Coal, Solar
│   │   │   ├── storage/                 EnergyCapacitor
│   │   │   └── magical/                 MagicWorkbench, Cauldron, Forge, Infuser
│   │   └── system/                      ECS tick systems
│   └── resources/
│       ├── manifest.json
│       ├── Common/UI/                   .ui GUI files (3 themes)
│       └── Server/Item/Items/           20× JSON item/block definitions
```

## TODO Before Production

- [ ] 3D `.blockymodel` files for all 10 machines (Blockbench)
- [ ] `PNG` icons for all items
- [ ] `PlayerResearchData` BSON Codec (cross-restart persistence)
- [ ] `BlockInteractEvent` import verified against server JAR
- [ ] Machine state JSON serialization (restart survival)
- [ ] Inventory pickup integration (`ItemContainer.addItemStack`)

---

*© 2026 Walker Crew Studio. Aunaria Slimefun 2.0 is proprietary — do not redistribute.*
