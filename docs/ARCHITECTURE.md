# Architettura Tecnica — D&D 5e Character Builder

## Stack Overview

| Layer | Tecnologia | Motivo |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Ecosistema maturo, type safety su modelli dati complessi, familiare |
| Styling | TailwindCSS + shadcn/ui | Mobile-first, componenti accessibili pronti, dark mode nativa |
| Grafici | Recharts | Composable, TypeScript-first, ottimo per radar/line/bar chart |
| State | Zustand | Leggero, senza boilerplate, persistenza locale integrata |
| Backend | Python 3.12 + FastAPI | Async, validazione Pydantic, auto-doc OpenAPI, ottimo per regole complesse |
| ORM | SQLAlchemy 2.0 + Alembic | Type-safe, migrations, switch trasparente SQLite → PostgreSQL |
| Database | SQLite (locale) | Zero config, file singolo, ideale per deployment locale |
| AI | Anthropic Claude API (claude-sonnet-4-6) | AI Advisor, ottimizzazione build, analisi sinergie |
| Desktop (futuro) | Tauri 2 | Wrapper nativo leggero (~10MB vs ~150MB Electron), stessa codebase web |

## Deployment Locale

```
┌─────────────────────────────────────────┐
│              LAN / WiFi                  │
│                                          │
│  PC (server)          Telefono / Tablet  │
│  ┌──────────┐         ┌──────────────┐  │
│  │ FastAPI  │◄───────►│   Browser    │  │
│  │ :8000    │         │  (any)       │  │
│  ├──────────┤         └──────────────┘  │
│  │  React   │                            │
│  │ :5173    │◄── Browser PC              │
│  ├──────────┤                            │
│  │  SQLite  │                            │
│  └──────────┘                            │
└─────────────────────────────────────────┘
```

Avvio con un solo comando (`make dev`). Il backend espone anche il frontend buildato in produzione locale — quindi un solo processo, una sola porta, accessibile da qualsiasi dispositivo sulla rete.

---

## Struttura del Progetto

```
dnd_5e_builder/
├── frontend/                   # React app
│   ├── src/
│   │   ├── components/         # Componenti UI riusabili
│   │   ├── pages/              # Pagine/route principali
│   │   ├── features/           # Feature slice (character, party, compare...)
│   │   ├── store/              # Zustand stores
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utility, helper, costanti D&D
│   │   └── types/              # TypeScript types / interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                    # FastAPI app
│   ├── app/
│   │   ├── api/                # Route handlers (endpoint REST)
│   │   ├── core/               # Config, dipendenze, sicurezza
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic schemas (request/response)
│   │   ├── services/           # Business logic
│   │   │   ├── rules_engine/   # Motore delle regole D&D 5e
│   │   │   ├── calculator/     # DPR, HP, statistiche, Monte Carlo
│   │   │   ├── importer/       # Fetch e normalizzazione dati Open5e/5etools
│   │   │   └── ai_advisor/     # Integrazione Claude API
│   │   └── main.py
│   ├── alembic/                # Migrazioni DB
│   ├── data/                   # Cache risorse scaricate (JSON)
│   ├── requirements.txt
│   └── pyproject.toml
│
├── docs/                       # Documentazione progetto
├── CLAUDE.md
└── Makefile                    # Comandi di sviluppo
```

---

## Frontend — Architettura

### Routing
React Router v6 con layout annidati:

```
/                           → Home / Dashboard
/characters                 → Lista personaggi
/characters/new             → Wizard creazione
/characters/:id             → Scheda personaggio
/characters/:id/level-up    → Wizard level-up
/characters/:id/progression → Timeline progressione
/compare                    → Comparatore build
/party                      → Party builder
/party/:id                  → Scheda party
/homebrew                   → Gestore risorse homebrew
/settings                   → Impostazioni app e regole opzionali
```

### State Management (Zustand)
Store separati per dominio:

```typescript
// Store principali
useCharacterStore     // personaggio corrente, snapshot per livello
usePartyStore         // composizione party
useResourceStore      // risorse D&D caricate (classi, razze, spell, ecc.)
useSettingsStore      // regole opzionali attive, preferenze UI
useSessionStore       // tracker sessione: HP correnti, slot usati, condizioni
useCompareStore       // build caricate nel comparatore
```

### Componenti Chiave
- `<CharacterSheet />` — scheda personaggio completa con tab (stats, spell, features, equipment)
- `<LevelTimeline />` — timeline orizzontale con le acquisizioni per livello
- `<BuildComparator />` — layout split con grafici sovrapposti
- `<RadarChart />` — profilo DPS/survivability/utility/control/support
- `<DPRChart />` — curva DPR per livello (1–20)
- `<PartyDashboard />` — copertura ruoli + sinergie
- `<EncounterSimulator />` — configuratore + output statistico
- `<SessionTracker />` — modalità al tavolo, interfaccia semplificata

---

## Backend — Architettura

### API REST (FastAPI)

```
GET  /api/resources/classes
GET  /api/resources/races
GET  /api/resources/spells
GET  /api/resources/feats
...                                     → Risorse D&D (con cache)

POST /api/characters                    → Crea personaggio
GET  /api/characters/:id
PUT  /api/characters/:id
GET  /api/characters/:id/snapshot/:lvl  → Build al livello X

POST /api/characters/:id/level-up       → Avanza livello
POST /api/characters/:id/revert/:lvl    → Torna al livello X

GET  /api/characters/:id/stats          → Statistiche calcolate
POST /api/characters/:id/simulate       → Simulazione Monte Carlo

POST /api/compare                       → Confronto tra build
POST /api/party                         → Crea party
GET  /api/party/:id/optimize            → Ottimizzazione build nel party

POST /api/ai/advise                     → AI Advisor su una build
POST /api/ai/optimize                   → Generazione build alternativa

POST /api/homebrew/validate             → Valida risorsa homebrew
```

### Rules Engine

Il cuore del sistema. Un modulo Python puro (no dipendenze esterne) che:

1. **Carica** le regole come dati strutturati (JSON normalizzato)
2. **Valida** ogni scelta del personaggio contro le regole attive
3. **Calcola** i derivati: HP, CA, spell slot, proficiency bonus, ecc.
4. **Inferisce** i prerequisiti: multiclass (STR/DEX ≥ 13, CHA ≥ 13, ecc.), armature, talenti
5. **Gestisce** i casi speciali: Pact Magic + slot ibridi, Unarmored Defense (Monk/Barbarian), ecc.

```python
# Interfaccia principale del motore
class RulesEngine:
    def validate_character(character: CharacterState) -> ValidationResult
    def validate_level_up(character: CharacterState, choices: LevelUpChoices) -> ValidationResult
    def validate_multiclass(character: CharacterState, new_class: str) -> ValidationResult
    def compute_stats(character: CharacterState) -> ComputedStats
    def compute_spell_slots(character: CharacterState) -> SpellSlotTable
    def get_available_choices(character: CharacterState, level: int) -> AvailableChoices
```

### Calculator (DPR e probabilità)

```python
class DPRCalculator:
    def compute_dpr(character: CharacterState, target_ac: int) -> DPRResult
    def monte_carlo(character: CharacterState, target_ac: int, rounds: int = 10000) -> MCResult
    def hit_probability(attack_bonus: int, target_ac: int, advantage: bool) -> float
    def expected_damage(dice: DiceExpression, crits: bool, advantage: bool) -> float
```

### AI Advisor

Integrazione con Claude API. Il prompt include:
- Snapshot completo della build corrente (JSON)
- Statistiche calcolate
- Obiettivo dell'utente (DPS / survivability / utility)
- Regole opzionali attive
- Composizione del party (se disponibile)

Claude risponde in JSON strutturato con: suggerimenti, spiegazioni, build alternative, ranking.

---

## Database — Schema (SQLite)

```sql
-- Personaggi
characters (id, name, created_at, updated_at, campaign_id)

-- Snapshot immutabile per ogni livello raggiunto
character_snapshots (
    id, character_id, level,
    state_json,     -- dump completo dello stato al quel livello
    created_at
)

-- Scelte effettuate a ogni level-up
level_up_choices (
    id, character_id, level,
    class_id, subclass_id,
    hp_roll, asi_choice, feat_id,
    spells_learned_json,
    choices_json        -- tutto il resto (invocations, fighting style, ecc.)
)

-- Party
parties (id, name, campaign_id, created_at)
party_members (party_id, character_id, role)

-- Risorse homebrew
homebrew_resources (id, type, name, source_label, data_json, validated_at)

-- Cache risorse esterne
resource_cache (id, source, resource_type, resource_key, data_json, cached_at)

-- Campagne / sessioni
campaigns (id, name, ruleset_options_json)
session_logs (id, campaign_id, date, notes, xp_awarded, loot_json)
```

---

## Integrazione Dati Esterni

### Open5e API (primaria)
- REST API pubblica, gratuita, nessuna API key
- Endpoint per: classi, razze, background, spell, feat, equipment, magic items, mostri
- Usata per il fetch iniziale e per gli aggiornamenti
- Normalizzazione in schema interno al momento del fetch

### 5etools (fallback / arricchimento)
- Dataset JSON disponibile su GitHub (5etools-mirror)
- Più completo di Open5e (include TCoE, optional class features, varianti)
- Scaricato e cachato localmente all'avvio

### Strategia di sync
1. Al primo avvio: fetch completo e salvataggio in `backend/data/`
2. Agli avvii successivi: check versione, aggiornamento incrementale
3. Offline: usa solo la cache locale
4. Homebrew: sempre locale, mai fetchato

---

## Desktop (Fase futura — Tauri)

Tauri 2 wrappa la web app esistente senza modifiche al codice:
- Il backend FastAPI gira come sidecar (processo figlio gestito da Tauri)
- Il frontend React è servito da Tauri direttamente
- Bundle finale: ~15–30 MB (vs ~150 MB Electron)
- Supporto: Windows, macOS, Linux

Nessuna modifica al codice frontend o backend — solo configurazione Tauri.

---

## Sviluppo Locale

```makefile
# Makefile
dev:          ## Avvia frontend + backend in watch mode
    concurrently "cd backend && uvicorn app.main:app --reload" \
                 "cd frontend && npm run dev"

setup:        ## Prima installazione
    cd backend && pip install -r requirements.txt
    cd frontend && npm install
    cd backend && alembic upgrade head
    cd backend && python -m app.cli fetch-resources

build:        ## Build produzione (frontend servito da FastAPI)
    cd frontend && npm run build
    # FastAPI servirà frontend/dist/ come static files

test:
    cd backend && pytest
    cd frontend && npm run test
```

Accesso da telefono: `http://<ip-locale>:8000` (FastAPI serve anche il frontend buildato).

---

## Decisioni Tecniche — Motivazioni

| Decisione | Alternativa scartata | Motivo |
|---|---|---|
| React + TS | Svelte | Ecosistema più ampio per componenti complessi, shadcn/ui, Recharts |
| FastAPI | Django / Flask | Async nativo, Pydantic integrato, auto-docs, più veloce per API pure |
| SQLite | PostgreSQL | Zero config in locale, Alembic garantisce migrazione futura triviale |
| Tauri (futuro) | Electron | 10x più leggero, nessuna dipendenza da Node in produzione |
| Zustand | Redux / Jotai | Minimo boilerplate, API semplice, persistenza localStorage integrata |
| Recharts | D3.js | Componenti React nativi, più rapido da usare, sufficiente per le feature richieste |
| Claude API | GPT / Gemini | Migliore comprensione del ragionamento complesso, tool use nativo |
