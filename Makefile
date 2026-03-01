# ─────────────────────────────────────────
# Fact Front — Makefile
# ─────────────────────────────────────────
start-server: ## Запустить сервер 
	docker compose up --build

logs: ## Логи production сервера
	docker compose logs -f server

# ── Development ───────────────────────────────────────────
dev-server: ## Запустить сервер в dev режиме
	cd server && npm run dev

dev-web: ## Запустить web в dev режиме
	cd web && npm run dev

dev-mobile-ios: ## Запустить mobile (Expo) на iOS
	cd mobile && npm run start:development

dev-mobile-android: ## Запустить mobile (Expo) на Android
	cd mobile && npm run start:development

stage-mobile-ios: ## Запустить mobile (Expo) на iOS в stage режиме
	cd mobile && npm run start:stage

stage-mobile-android: ## Запустить mobile (Expo) на Android в stage режиме
	cd mobile && npm run start:stage

# ── Stage ─────────────────────────────────────────────────
deploy-stage: ## Задеплоить stage окружение
	docker compose -f docker-compose.stage.yml up postgres server web -d --build

# ── Production ────────────────────────────────────────────
deploy-prod: ## сервер и админку на деплое
	docker compose -f docker-compose.prod.yml up postgres server web -d --build

# ── Help ──────────────────────────────────────────────────
help: ## Показать список команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
