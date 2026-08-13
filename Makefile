.PHONY: help dev dev-services stop build migrate seed test lint clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev-services: ## Start infrastructure services (PostgreSQL, Redis, ChromaDB)
	docker compose up -d postgres redis chroma

dev: ## Start full development stack
	docker compose up -d

stop: ## Stop all services
	docker compose down

build: ## Build all Docker images
	docker compose build

migrate: ## Run database migrations
	cd backend && alembic upgrade head

migrate-new: ## Create new migration (usage: make migrate-new msg="add users table")
	cd backend && alembic revision --autogenerate -m "$(msg)"

seed: ## Seed knowledge base into ChromaDB
	cd backend && python -m app.ai.rag.ingestion

test: ## Run backend tests
	cd backend && pytest -v

lint: ## Lint backend code
	cd backend && ruff check . && ruff format --check .

clean: ## Remove all containers, volumes, and build artifacts
	docker compose down -v --remove-orphans
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
