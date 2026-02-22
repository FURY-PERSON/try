# ─────────────────────────────────────────
# WordPulse — Makefile
# ─────────────────────────────────────────

dev-start: ## Запустить server в dev режиме
	docker compose up

dev-web: ## Запустить web в dev режиме
	cd web && npm run dev

dev-mobile: ## Запустить mobile (Expo)
	cd mobile && npm run dev

help: ## Показать список команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
.PHONY: dev-server dev-web dev-mobile help
