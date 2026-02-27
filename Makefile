# ─────────────────────────────────────────
# Fact Front — Makefile
# ─────────────────────────────────────────

start-server: ## Запустить сервер 
	docker compose up --build

dev-web: ## Запустить web в dev режиме
	cd web && npm run dev

dev-mobile-ios: ## Запустить mobile (Expo) на iOS
	cd mobile && npm run ios

dev-mobile-android: ## Запустить mobile (Expo) на Android
	cd mobile && npm run android

help: ## Показать список команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
.PHONY: dev-server dev-web dev-mobile help
