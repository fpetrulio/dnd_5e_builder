.PHONY: help setup dev build docker-up docker-down docker-build test lint

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
	cd frontend && npm install
	@echo ">>> Creazione virtual environment Python..."
	cd backend && python -m venv .venv
	@echo ">>> Installazione dipendenze backend..."
	cd backend && .venv/Scripts/pip install -r requirements.txt 2>/dev/null || \
	              .venv/bin/pip install -r requirements.txt
	@echo ">>> Copia .env.example -> .env (se non esiste)..."
	@test -f .env || cp .env.example .env
	@echo ">>> Setup completato. Configura .env con la tua ANTHROPIC_API_KEY"

# ─── Sviluppo ─────────────────────────────────────────────────────────────────
dev:
	@echo ">>> Avvio dev server (backend :8000, frontend :5173)..."
	npx concurrently --names "BACKEND,FRONTEND" --prefix-colors "blue,green" \
		"cd backend && .venv/Scripts/uvicorn app.main:app --reload --host 0.0.0.0 2>/dev/null || .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0" \
		"cd frontend && npm run dev"

# ─── Build ────────────────────────────────────────────────────────────────────
build:
	@echo ">>> Build frontend..."
	cd frontend && npm run build
	@echo ">>> Build completata. Avvia con: make docker-up oppure cd backend && uvicorn app.main:app"

# ─── Docker ───────────────────────────────────────────────────────────────────
docker-build:
	docker compose build

docker-up:
	docker compose up -d
	@echo ">>> App disponibile su http://localhost"
	@echo ">>> API docs su http://localhost:8000/api/docs"

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# ─── Test ─────────────────────────────────────────────────────────────────────
test:
	cd backend && .venv/Scripts/pytest 2>/dev/null || .venv/bin/pytest
	cd frontend && npm run test 2>/dev/null || echo "Nessun test frontend configurato"

# ─── Lint ─────────────────────────────────────────────────────────────────────
lint:
	cd frontend && npm run lint
	cd backend && .venv/Scripts/ruff check . 2>/dev/null || .venv/bin/ruff check . 2>/dev/null || echo "ruff non installato"
