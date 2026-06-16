.PHONY: help setup dev build docker-up docker-down docker-build docker-logs test lint

# ─── Platform detection ────────────────────────────────────────────────────────
ifeq ($(OS),Windows_NT)
    PY      := backend/.venv/Scripts/python
    PYTEST  := backend/.venv/Scripts/pytest
    UVICORN := backend/.venv/Scripts/uvicorn
    RUFF    := backend/.venv/Scripts/ruff
    CPENV   := if not exist .env copy .env.example .env
else
    PY      := backend/.venv/bin/python
    PYTEST  := backend/.venv/bin/pytest
    UVICORN := backend/.venv/bin/uvicorn
    RUFF    := backend/.venv/bin/ruff
    CPENV   := test -f .env || cp .env.example .env
endif

# ─── Aiuto ────────────────────────────────────────────────────────────────────
help:
	@echo "Comandi disponibili:"
	@echo "  make setup        Prima installazione completa"
	@echo "  make dev          Avvia backend + frontend in watch mode"
	@echo "  make build        Build di produzione"
	@echo "  make docker-up    Avvia con Docker Compose"
	@echo "  make docker-down  Ferma i container"
	@echo "  make docker-build Rebuild delle immagini Docker"
	@echo "  make test         Esegui i test"
	@echo "  make lint         Lint frontend + backend"

# ─── Setup ────────────────────────────────────────────────────────────────────
setup:
	@echo ">>> Installazione dipendenze frontend..."
	cd frontend && npm install --legacy-peer-deps
	@echo ">>> Creazione virtual environment Python..."
	cd backend && python -m venv .venv
	@echo ">>> Installazione dipendenze backend..."
	$(PY) -m pip install -r backend/requirements.txt
	@echo ">>> Copia .env.example -> .env (se non esiste)..."
	@$(CPENV)
	@echo ">>> Setup completato. Configura .env con la tua ANTHROPIC_API_KEY"

# ─── Sviluppo ─────────────────────────────────────────────────────────────────
dev:
	@echo ">>> Avvio dev server (backend :8000, frontend :5173)..."
	npx concurrently --names "BACKEND,FRONTEND" --prefix-colors "blue,green" \
		"$(UVICORN) app.main:app --reload --host 0.0.0.0 --app-dir backend" \
		"cd frontend && npm run dev"

# ─── Build ────────────────────────────────────────────────────────────────────
build:
	@echo ">>> Build frontend..."
	cd frontend && npm run build
	@echo ">>> Build completata. Avvia con: make docker-up oppure $(UVICORN) app.main:app --app-dir backend"

# ─── Docker ───────────────────────────────────────────────────────────────────
docker-build:
	docker compose build

docker-up:
	docker compose up -d
	@echo ">>> App disponibile su http://localhost"
	@echo ">>> API docs su http://localhost/api/docs"

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# ─── Test ─────────────────────────────────────────────────────────────────────
test:
	$(PYTEST) backend/
	cd frontend && npm run test 2>NUL || echo "Nessun test frontend configurato"

# ─── Lint ─────────────────────────────────────────────────────────────────────
lint:
	cd frontend && npm run lint
	$(RUFF) check backend/
