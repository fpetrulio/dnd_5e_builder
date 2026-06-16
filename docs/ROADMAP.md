# Roadmap — D&D 5e Character Builder

## Fase 0 — Fondamenta (MVP tecnico)
- [x] Scelta dello stack tecnico (frontend, backend, DB)
- [x] Setup progetto, CI/CD, ambiente di sviluppo
- [x] Integrazione API dati ufficiali (Open5e con cache SQLite)
- [x] Modello dati: personaggio, build, livello, snapshot
- [x] Motore delle regole base (HP, AC, prof bonus, saves, skills, spell slots)
- [ ] 5etools JSON come fallback/arricchimento
- [ ] GitHub Actions CI (lint + test on push)

## Fase 1 — Creazione Personaggio
- [x] Wizard di creazione guidata (4 step: identity, abilities, background, review)
- [x] Scelta razza / classe / background
- [x] Generazione caratteristiche (Standard Array, Point Buy, manuale)
- [x] Scheda personaggio base visualizzata (5 tab: overview, abilities, skills, features, spells)
- [x] Selezione competenze nelle abilità (skill proficiency selection)
- [x] Scelta sottorazza con bonus applicati
- [x] Metodo dadi (4d6 drop lowest) con assegnazione libera
- [x] Visualizzazione capacità di classe per livello nella scheda (tab Features)
- [ ] Equipaggiamento iniziale
- [ ] Validazione regole in tempo reale con messaggi esplicativi

## Fase 2 — Progressione e Revert
- [x] Level-up wizard (HP choice, ASI, subclass, confirm)
- [x] Snapshot immutabile per livello (creato automaticamente prima di ogni level-up)
- [x] Revert a livello precedente (con pulizia snapshot successivi)
- [x] Timeline visuale della progressione (bubble per livello, click per snapshot)
- [x] Vista build per ogni livello (SnapshotPage con scheda read-only)
- [x] Endpoint GET /characters/{id}/level-up-info (has_asi, has_subclass_choice, ecc.)
- [ ] Multiclassing (level-up di una seconda classe)
- [ ] Selezione subclass da lista (invece di testo libero)

## Fase 3 — Analisi e Statistiche
- [x] Calcolo HP, CA, iniziativa, spell slot (nel motore delle regole)
- [ ] Calcolo DPR (danni per round)
- [ ] Simulatore probabilistico (Monte Carlo)
- [ ] Dashboard grafica per singola build
- [ ] Radar chart e grafici di progressione

## Fase 4 — Confronto e AI
- [x] Endpoint AI advisor (advise + compare) — solo backend
- [ ] UI comparatore build (pagina /compare esiste ma è vuota)
- [ ] Diff visuale tra livelli
- [ ] UI AI Advisor integrata nella scheda personaggio
- [ ] Ottimizzatore con obiettivo (DPS / survivability / utility)

## Fase 5 — Homebrew e Risorse Custom
- [ ] Editor risorse homebrew (pagina /homebrew esiste ma è vuota)
- [ ] Validazione homebrew vs regole
- [ ] Import/export pacchetti homebrew

## Fase 6 — Party Builder
- [ ] Composizione party
- [ ] Dashboard copertura ruoli
- [ ] Ottimizzazione contestuale al party
- [ ] Sinergie di gruppo e simulazione encounter

## Fase 7 — Export e Condivisione
- [ ] Export PDF scheda personaggio
- [ ] Condivisione build via link
- [ ] Import da JSON / D&D Beyond

## Fase 8 — Simulatore di Encounter
- [ ] Simulazione round vs mostro singolo
- [ ] Simulazione party completo
- [ ] Distribuzione danni e probabilità sopravvivenza
- [ ] Configurazione condizioni iniziali e terreno

## Fase 9 — Session Companion
- [ ] Tracker HP / slot / risorse correnti
- [ ] Riposo breve e lungo con recupero automatico
- [ ] Condition e concentration tracker
- [ ] Diario del personaggio e log sessioni

## Fase 10 — Tool Avanzati
- [ ] Spell slot manager avanzato (multiclass + Pact Magic)
- [ ] Breakpoint detector visuale
- [ ] Libreria template e archetypes
- [ ] Community homebrew sharing
