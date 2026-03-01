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

# ── Mobile Build ──────────────────────────────────────────

xcode-stage: ## Открыть Xcode с конфигом stage (затем Product → Archive)
	cd mobile && NODE_ENV=stage open ios/Frontfaktov.xcworkspace

xcode-prod: ## Открыть Xcode с конфигом production (затем Product → Archive)
	cd mobile && NODE_ENV=production open ios/Frontfaktov.xcworkspace

# ── Stage ─────────────────────────────────────────────────
STAGE_HOST=root@5.42.105.253
STAGE_SSH_KEY=ssh/stage
STAGE_DIR=/root/app
DOMAIN=6804903-vp245627.twc1.net
CERTBOT_EMAIL=mikhailhoroshik@gmail.com
SSH=ssh -i $(STAGE_SSH_KEY) -o ServerAliveInterval=30 -o ServerAliveCountMax=20

sync-stage: ## Синхронизировать файлы на stage сервер
	rsync -avz --progress \
		--exclude 'node_modules' \
		--exclude '.git' \
		--exclude 'mobile' \
		--exclude '*.log' \
		-e "ssh -i $(STAGE_SSH_KEY)" \
		. $(STAGE_HOST):$(STAGE_DIR)

init-stage: sync-stage ## Первоначальная настройка HTTPS (запускать один раз на новом сервере)
	$(SSH) $(STAGE_HOST) "\
		cd $(STAGE_DIR) && \
		cp stage.env .env && \
		docker compose -f docker-compose.stage.yml down --remove-orphans && \
		docker run --rm \
			-p 80:80 \
			-v /etc/letsencrypt:/etc/letsencrypt \
			-v /var/lib/letsencrypt:/var/lib/letsencrypt \
			certbot/certbot certonly \
			--standalone \
			--email $(CERTBOT_EMAIL) \
			--agree-tos \
			--no-eff-email \
			-d $(DOMAIN) && \
		docker compose -f docker-compose.stage.yml up -d --build"

deploy-stage: sync-stage ## Задеплоить stage окружение (sync + запуск на сервере)
	$(SSH) $(STAGE_HOST) \
		"cd $(STAGE_DIR) && \
		cp stage.env .env && \
		docker compose -f docker-compose.stage.yml up -d --build"

certbot-stage: ## Получить SSL сертификат и запустить nginx (после снятия rate limit)
	$(SSH) $(STAGE_HOST) "\
		cd $(STAGE_DIR) && \
		docker run --rm \
			-p 80:80 \
			-v /etc/letsencrypt:/etc/letsencrypt \
			-v /var/lib/letsencrypt:/var/lib/letsencrypt \
			certbot/certbot certonly \
			--standalone \
			--email $(CERTBOT_EMAIL) \
			--agree-tos \
			--no-eff-email \
			-d $(DOMAIN) && \
		docker compose -f docker-compose.stage.yml up -d nginx"

renew-cert-stage: ## Обновить SSL сертификат
	$(SSH) $(STAGE_HOST) "\
		cd $(STAGE_DIR) && \
		docker compose -f docker-compose.stage.yml stop nginx && \
		docker run --rm \
			-p 80:80 \
			-v /etc/letsencrypt:/etc/letsencrypt \
			-v /var/lib/letsencrypt:/var/lib/letsencrypt \
			certbot/certbot renew --standalone && \
		docker compose -f docker-compose.stage.yml start nginx"

logs-stage: ## Логи stage сервера (все сервисы)
	$(SSH) $(STAGE_HOST) "cd $(STAGE_DIR) && docker compose -f docker-compose.stage.yml logs -f"

# ── Production ────────────────────────────────────────────
deploy-prod: ## сервер и админку на деплое
	docker compose -f docker-compose.prod.yml up postgres server web -d --build

# ── Help ──────────────────────────────────────────────────
help: ## Показать список команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
