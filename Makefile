# ─────────────────────────────────────────
# Fact Front — Makefile
# ─────────────────────────────────────────
start-server: ## Запустить сервер 
	docker compose up --build


# ── Production ────────────────────────────────────────────
deploy: ## Задеплоить production (build + up)
	./deploy.sh

deploy-fresh: ## Задеплоить с нуля (без Docker кеша)
	./deploy.sh --no-cache

stop: ## Остановить production контейнеры
	./deploy.sh --down

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

# ── Database ──────────────────────────────────────────────
db-up: ## Запустить только PostgreSQL (для локальной разработки)
	docker compose up postgres -d

db-migrate-dev: ## Применить миграции (dev)
	cd server && npx prisma migrate dev

db-migrate-prod: ## Применить миграции (prod — внутри контейнера)
	docker compose exec server npx prisma migrate deploy

db-studio: ## Открыть Prisma Studio
	cd server && npx prisma studio

# ── Help ──────────────────────────────────────────────────
help: ## Показать список команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
.PHONY: deploy deploy-fresh stop logs dev-server dev-web dev-mobile-ios dev-mobile-android db-up db-migrate-dev db-migrate-prod db-studio help
