# LootWatch

A guild loot distribution tracker for **World of Warcraft: The Burning Crusade**. Built for raid councils to plan, record, and analyse loot across the full TBC progression.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Backend / Auth | Supabase (PostgreSQL + Row Level Security) |
| Deployment | GitHub Actions → GitHub Pages |

---

## Roles

| Role | Access |
|---|---|
| **Council** | Full access — all views, import, edit, manage roster, plan loot |
| **Raider** | Read-only — Loot History only |

Roles are managed per-user in the Admin panel or directly in the `profiles` table.

---

## Features

### Loot History

The main log of all loot awarded during raids.

- **Loot Table** — sortable and filterable table of every loot entry. Columns: Date, Player (class-coloured), Item (Wowhead link), Raid, Boss, Response, Votes, Notes.
  - **Search** by player name, item name, or boss
  - **Filter** by raid or class
  - **Edit Raid** inline (council) — click the raid name to correct RCLC misdetections
  - **Edit Notes** inline (council) — click the note cell to add or update a note
  - **Delete entry** (council) — hover a row to reveal the delete button
- **Player Summary** — card grid showing each player's loot totals with a per-response breakdown (BIS, Upgrade, Offspec, etc.) shown as colour-coded progress bars
  - **Sort by:** Total items · BIS · Upgrade · Offspec
- **Warnings** — flags players who need attention:
  - 🔴 **No loot received** — rostered players with zero entries in history
  - 🟡 **Low loot** — players below 50 % of the guild average

#### CSV Import

Import loot from **RCLootCouncil** exports — either upload a `.csv` file or paste the raw CSV text directly.

- Supports the current RCLC TBC export format (`player, date, time, id, item, itemID, …, owner`)
- **Duplicate detection** — before importing, entries are compared against existing history by player + item + date. If duplicates are found an orange warning panel lists them, with options to skip duplicates or import everything anyway
- Realm suffixes (e.g. `-Spineshatter`) are stripped automatically on import

---

### Council

Restricted to council members.

#### Loot Planner

Browse all 25-man TBC raid loot organised by phase and boss, and assign candidates to items for pre-raid planning.

- **Phase tabs** — Phase 1 through Phase 5, each showing the raids it contains with item counts

  | Phase | Raids |
  |---|---|
  | 1 | Karazhan · Gruul's Lair · Magtheridon's Lair |
  | 2 | Serpentshrine Cavern · Tempest Keep |
  | 3 | Mount Hyjal · Black Temple |
  | 4 | Zul'Aman |
  | 5 | Sunwell Plateau |

- **Items** are listed flat under each boss with the Wowhead icon thumbnail and a link to the item page
- **Candidates** appear as inline pills coloured by WoW class, numbered by priority
  - **Add candidate** — type to search the roster (autocomplete with class colours), arrow keys to navigate, Enter or click to add
  - **Reorder** — hover a pill to reveal ◂ ▸ buttons
  - **Remove** — hover a pill and click ✕

#### Roster

Manage the guild member list independently of loot history.

- **Add member** manually — name, class, rank
- **Edit rank** inline — click any rank cell to update it
- **Remove member** — confirmation prompt before deletion
- **Sync from History** — if players appear in loot history but not in the roster, a banner shows how many are missing with a one-click sync button that adds them all

#### Distribution

Ranks players by fewest items received — useful for identifying who is next in line for loot consideration.

#### Priority Notes

Free-form priority notes per player/item with High / Medium / Low tags.

---

### Admin

Council-only panel for managing LootWatch user accounts.

- Lists all registered users with username, role, and join date
- **Promote to Council** / **Demote to Raider** toggle per user
