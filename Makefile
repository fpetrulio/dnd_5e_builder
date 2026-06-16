.PHONY: help setup dev build docker-up docker-down docker-build docker-logs test lint

# ─── Platform detection ────────────────────────────────────────────────────────
ifeq ($(OS),Windows_NT)
    PY      := backend/.venv/Scripts/python
    PYTEST  := backend/.venv/Scripts/pytest
    UVICORN := backend/.venv/Scripts/uvicorn
    RUFF    := backend/.venv/Scripts/ruff
    MYPY    := backend/.venv/Scripts/mypy
    CPENV   := if not exist .env copy .env.example .env
else
    PY      := backend/.venv/bin/python
    PYTEST  := backend/.venv/bin/pytest
    UVICORN := backend/.venv/bin/uvicorn
    RUFF    := backend/.venv/bin/ruff
    MYPY    := backend/.venv/bin/mypy
    CPENV   := test -f .env || cp .env.example .env
endif

# ─── Aiuto ────────────────────────────────────────────────────────────────────
help:
	@echo "Available commands:"
	@echo "  make setup        Full first-time install"
	@echo "  make dev          Start backend + frontend in watch mode"
	@echo "  make build        Production build"
	@echo "  make docker-up    Start with Docker Compose"
	@echo "  make docker-down  Stop containers"
	@echo "  make docker-build Rebuild Docker images"
	@echo "  make test         Run tests"
	@echo "  make lint         Lint frontend + backend"

# ─── Setup ────────────────────────────────────────────────────────────────────
setup:
	@echo ">>> Installing frontend dependencies..."
	cd frontend && npm install --legacy-peer-deps
	@echo ">>> Creating Python virtual environment..."
	cd backend && python -m venv .venv
	@echo ">>> Installing backend dependencies..."
	$(PY) -m pip install -r backend/requirements.txt
	@echo ">>> Copying .env.example -> .env (if missing)..."
	@$(CPENV)
	@echo ">>> Setup complete. Set your ANTHROPIC_API_KEY in .env"

# ─── Sviluppo ─────────────────────────────────────────────────────────────────
dev:
	@echo ">>> Starting dev server (backend :8000, frontend :5173)..."
	npx concurrently --names "BACKEND,FRONTEND" --prefix-colors "blue,green" \
		"$(UVICORN) app.main:app --reload --host 0.0.0.0 --app-dir backend" \
		"cd frontend && npm run dev"

# ─── Build ────────────────────────────────────────────────────────────────────
build:
	@echo ">>> Building frontend..."
	cd frontend && npm run build
	@echo ">>> Build complete. Run with: make docker-up or $(UVICORN) app.main:app --app-dir backend"

# ─── Docker ───────────────────────────────────────────────────────────────────
docker-build:
	docker compose build

docker-up:
	docker compose up -d
	@echo ">>> App available at http://localhost"
	@echo ">>> API docs at http://localhost/api/docs"

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
	$(MYPY) backend/app --ignore-missing-imports --python-version 3.12
