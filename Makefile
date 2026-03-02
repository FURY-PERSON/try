# ─────────────────────────────────────────
# Fact Front — local development
# ─────────────────────────────────────────

dev-server: ## Start NestJS server in dev mode
	cd server && npm run dev

dev-web: ## Start web admin panel in dev mode
	cd web && npm run dev

dev-db: ## Start local PostgreSQL via Docker
	docker compose up -d postgres

dev-all: ## Start all local services (DB + server)
	docker compose up -d

mobile-ios: ## Run Expo on iOS (development)
	cd mobile && npm run start:development

mobile-android: ## Run Expo on Android (development)
	cd mobile && npm run start:development

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
