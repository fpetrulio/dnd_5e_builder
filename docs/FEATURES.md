# Feature List — D&D 5e Character Builder

## 1. Data Layer

### 1.1 Import risorse ufficiali
- Integrazione con API esterne (5etools, Open5e, D&D Beyond API ove disponibile)
- Sync automatico degli aggiornamenti delle risorse
- Cache locale delle risorse scaricate per uso offline
- Supporto a tutte le sorgenti ufficiali: PHB, XGtE, TCoE, MToF, VGtM, FToD, SCoC, ecc.
- Risorse coperte: classi, sottoclassi, razze, sottorazze, background, talenti, incantesimi, equipaggiamento, armi, armature, oggetti magici, capacità speciali, condizioni, regole opzionali

### 1.2 Risorse personalizzate (homebrew)
- Creazione di risorse locali per ogni tipo: classi, sottoclassi, razze, background, talenti, incantesimi, armi, oggetti, capacità speciali
- Editor visuale per la definizione delle risorse homebrew
- Validazione automatica della coerenza delle risorse create con le regole del sistema
- Import/export di pacchetti homebrew in formato JSON
- Separazione visiva tra contenuto ufficiale e homebrew nell'interfaccia

---

## 2. Creazione del Personaggio

### 2.1 Wizard di creazione
- Creazione guidata passo-passo
- Scelta del livello di partenza (1–20)
- Metodi di generazione delle caratteristiche: Standard Array, Point Buy, lancio dadi (con log dei risultati)
- Scelta di razza, sottorazza, classe, background
- Assegnazione delle competenze, linguaggi, equipaggiamento iniziale
- Anteprima in tempo reale del personaggio durante la creazione

### 2.2 Motore delle regole
- Inferenza automatica di tutte le regole di D&D 5e:
  - Prerequisiti di razza/classe/sottoclasse
  - Vincoli sull'acquisizione dei talenti (ASI vs feat, Human Variant, ecc.)
  - Regole di biclassamento: prerequisiti di caratteristica, spell slot ibridi (tabella multiclass), limitazioni di armatura/arma
  - Regole opzionali configurabili: Feats at 1st Level, Variant Human, Custom Lineage, Optional Class Features (TCoE), ecc.
  - Proficiency Bonus automatico per livello
  - Calcolo automatico di HP, CA, iniziativa, tiri salvezza, competenze
- Validazione in tempo reale con messaggi di errore esplicativi sulle violazioni delle regole

---

## 3. Progressione del Personaggio

### 3.1 Avanzamento di livello
- Wizard guidato per ogni level-up
- Suggerimenti contestuali su cosa scegliere a ogni livello (spell, ASI, sottoclasse, ecc.)
- Validazione automatica delle scelte in base alle regole
- Tracking di: HP guadagnati (media o lancio), spell apprese, capacità acquisite, ASI/talenti scelti

### 3.2 Revert di livello
- Possibilità di riportare il personaggio a un livello precedente qualunque
- Preview delle modifiche che verranno annullate prima di confermare
- Snapshot immutabile del personaggio a ogni livello superato
- Storico completo delle scelte effettuate a ogni livello

### 3.3 Ispezione della progressione
- Timeline visuale dei livelli con le acquisizioni per ciascuno
- Vista "build al livello X": mostra il personaggio esattamente come era a quel livello
- Confronto differenziale tra due livelli qualsiasi: evidenzia cosa è cambiato (nuove capacità, spell, statistiche)
- Grafici di progressione per: HP, CA, DPR, attack bonus, spell slot

---

## 4. Analisi e Statistiche della Build

### 4.1 Scheda riassuntiva
- Statistiche calcolate: HP totali, CA, iniziativa, velocità, tiri salvezza
- Attack bonus per ogni attacco disponibile
- Danni per round (DPR): media, massimo, minimo
- Gestione slot incantesimo per livello e per lungo/breve riposo
- Elenco capacità speciali con descrizione e frequenza d'uso (riposo breve/lungo, a volontà, ecc.)

### 4.2 Dashboard grafica
- Grafici radar: DPS, survivability, utility, control, support, mobility
- Grafico DPR per livello (curva di crescita)
- Probabilità di colpire diversi valori di CA (curva hit chance)
- Combo e sinergie rilevate automaticamente tra capacità
- Sustain: calcolo HP medi per lungo riposo includendo healing
- Breakpoint evidenziati: livelli chiave dove la build cambia significativamente

### 4.3 Calcolo probabilistico
- Simulatore Monte Carlo per DPR (N iterazioni configurabili)
- Probabilità di successo su tiri salvezza a diversi DC
- Expected value degli attacchi con Advantage/Disadvantage
- Calcolo automatico di Extra Attack, Sneak Attack, Divine Smite, ecc.

---

## 5. Confronto Build

### 5.1 Comparatore
- Confronto side-by-side di due o più build
- Grafici sovrapposti per tutte le metriche (DPR, HP, CA, spell slot, ecc.)
- Evidenziazione automatica dei punti di forza/debolezza relativi
- Confronto a un livello specifico o su tutta la progressione 1–20

### 5.2 Storico e versioning
- Possibilità di salvare varianti della stessa build (es. "Warlock puro" vs "Warlock/Paladin 6/4")
- Diff visuale tra varianti
- Libreria personale di build salvate

---

## 6. AI Advisor

### 6.1 Suggerimenti di build
- Analisi automatica della build corrente con identificazione di debolezze
- Suggerimenti contestuali su: talenti consigliati, spell da aggiungere, sottoclassi sinergiche, oggetti magici consigliati
- Spiegazione del ragionamento dietro ogni suggerimento
- Modalità "ottimizza per obiettivo": massimizza DPR / survivability / utility / versatilità

### 6.2 Confronto AI
- Generazione automatica di build alternative ottimizzate per lo stesso concept
- Ranking comparativo con spiegazione dei trade-off
- Suggerimento del livello di biclassamento ottimale (es. "Paladin 2 / Warlock 18 vs Paladin 6 / Warlock 14")

---

## 7. Party Builder e Ottimizzazione di Gruppo

### 7.1 Creazione del party
- Composizione di un gruppo da 1 a N personaggi
- Visualizzazione della copertura dei ruoli: tank, healer, DPS, controller, support, utility
- Identificazione di lacune nella composizione del party

### 7.2 Ottimizzazione contestuale
- Ottimizzazione della build di un personaggio in base alla composizione del resto del party
- Suggerimenti per colmare le lacune del gruppo (es. "manca healing, considera Paladin o Cleric")
- Calcolo delle sinergie di party: aura del Paladin, Bardic Inspiration, Wolf Totem, Pack Tactics, ecc.
- Simulazione di encounter con il party completo

### 7.3 Dashboard di party
- Grafici di copertura del party per ruolo
- Statistiche aggregate: DPR totale, HP totali, CC disponibile
- Radar chart del party vs encounter tier (CR medio gestibile)

---

## 8. Export e Condivisione

- Export scheda personaggio in PDF (formato classico D&D 5e + formato custom)
- Export build in JSON per backup o import in altri tool
- Condivisione build via link (URL univoco)
- Import da D&D Beyond (ove API disponibile) o da JSON
- Stampa ottimizzata della scheda personaggio

---

## 9. Regole Opzionali e Varianti

- Supporto alle varianti ufficiali: Variant Human, Custom Lineage, Optional Class Features (TCoE)
- Regole opzionali attivabili per sessione: Feats at 1st Level, Flanking, Encumbrance, ecc.
- Gestione delle restrizioni di campagna (es. "solo PHB + 1 splatbook", "no evil alignment")
- Supporto a Epic Boons (livelli 20+)

---

## 10. Simulatore di Encounter

- Simulazione di N round di combattimento tra la build e uno o più mostri (per CR o per statblock specifico)
- Output: distribuzione dei danni inflitti, probabilità di sopravvivenza del personaggio, risorse consumate per encounter
- Modalità party: simulazione con il gruppo completo
- Utile per validare le statistiche calcolate (DPR, sustain) in scenari reali
- Configurabile: vantaggio/svantaggio, terreno difficile, spell precast, condizioni iniziali

---

## 11. Tracker di Sessione (Companion Mode)

- Monitoraggio HP correnti, slot incantesimo usati, capacità a riposo breve/lungo già spese
- Tracker Hit Dice usati e recuperati
- Pulsante "Riposo Breve" e "Riposo Lungo" con calcolo automatico delle risorse recuperate
- Storico degli encounter della sessione corrente
- Nota veloce per appunti di sessione (loot trovato, PNG incontrati, ecc.)
- Modalità "al tavolo": interfaccia semplificata ottimizzata per uso rapido durante il gioco

---

## 12. Condition e Concentration Tracker

- Lista delle condizioni attive sul personaggio (Poisoned, Frightened, Grappled, ecc.) con descrizione degli effetti
- Concentration tracker: un solo incantesimo alla volta, con avviso automatico se si tenta di concentrarsi su un secondo
- Tiro salvezza Costituzione automatico su danno subito mentre si è in concentrazione (DC = max(10, danno/2))
- Indicatore visuale dello stato del personaggio (condizioni + concentrazione attiva)

---

## 13. Spell Slot Manager Avanzato (Multiclass)

- Calcolo automatico degli slot ibridi per ogni combinazione di multiclass spellcaster (regola PHB tabella multiclasse)
- Gestione separata di Pact Magic (Warlock) dagli slot standard: slot corti, livello fisso, recupero a riposo breve
- Conversione automatica Sorcery Points ↔ Spell Slots (Sorcerer)
- Wizard Arcane Recovery, Druid Wild Shape spell slot (Moon Druid), Channel Divinity, ecc.
- Avvisi su scelte di multiclass che interrompono la progressione degli incantesimi (es. perdita di slot di 6° livello)

---

## 14. Breakpoint Detector

- Analisi automatica della build per identificare i livelli "chiave" dove conviene fermare il multiclass
- Evidenziazione delle feature chiave per livello di ogni classe (es. Paladin 6 → Aura of Protection, Warlock 5 → 3° slot Pact Magic)
- Calcolo del "costo opportunità" del multiclass: cosa si perde ritardando la classe principale
- Visualizzazione grafica dei breakpoint sulla timeline della progressione
- Integrazione con AI Advisor per suggerire split ottimali (es. "Paladin 2 sblocca Divine Smite con slot Warlock: fortissima sinergia")

---

## 15. Template e Archetypes

- Libreria di build archetipiche pronte: Coffeelock, SAD Paladin, Hexblade Dip, Gloom Stalker Assassin, ecc.
- Ogni template include: descrizione del concept, punti di forza/debolezza, livelli chiave, varianti consigliate
- Uso come punto di partenza per una nuova build o come riferimento per i confronti
- Template contribuiti dalla community (con moderazione)
- Filtri per: ruolo, stile di gioco, difficoltà di gestione, tier di campagna

---

## 16. Diario del Personaggio (Campaign Companion)

- Log delle sessioni giocate con data, note e XP guadagnati
- Tracker del loot: oggetti trovati con link alla scheda e assegnazione al personaggio
- Storia del personaggio: eventi rilevanti, PNG conosciuti, obiettivi
- Progressione XP con soglie di livello visualizzate
- Timeline della campagna sovrapposta alla timeline dei livelli

---

## 17. UX e Interfaccia

- Interfaccia responsive (desktop + tablet + mobile per uso al tavolo)
- Dark mode / Light mode
- Ricerca globale rapida su tutte le risorse
- Tooltip e popup con descrizione completa di ogni capacità, incantesimo, talento
- Onboarding guidato per nuovi utenti
- Localizzazione multilingua (IT, EN come priorità)
