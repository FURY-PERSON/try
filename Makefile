# ─────────────────────────────────────────
# Fact Front — local development
# ─────────────────────────────────────────

dev-server: ## Start NestJS server in dev mode
	docker compose up -d --build

dev-web: ## Start web admin panel in dev mode
	cd web && npm run dev

mobile-ios: ## Run Expo on iOS (development)
	cd mobile && npm run ios:development-debug

mobile-android: ## Run Expo on Android (development)
	cd mobile && npm run android:development-debug

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
