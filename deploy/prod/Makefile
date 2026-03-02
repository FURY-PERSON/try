ROOT          := ../..
PROD_HOST     := root@PROD_SERVER_IP
PROD_SSH_KEY  := $(ROOT)/ssh/prod
PROD_DIR      := /root/app
DOMAIN        := your-domain.com
EMAIL         := mikhailhoroshik@gmail.com
COMPOSE       := docker compose -f deploy/prod/docker-compose.yml --env-file deploy/prod/prod.env
SSH           := ssh -i $(PROD_SSH_KEY) -o ServerAliveInterval=30 -o ServerAliveCountMax=20

sync: ## Sync files to prod server
	rsync -avz --progress \
		--exclude 'node_modules' \
		--exclude '.git' \
		--exclude 'mobile' \
		--exclude '*.log' \
		-e "ssh -i $(PROD_SSH_KEY)" \
		$(ROOT)/ $(PROD_HOST):$(PROD_DIR)

deploy: sync ## Deploy to production (sync + rebuild and restart all services)
	$(SSH) $(PROD_HOST) "cd $(PROD_DIR) && $(COMPOSE) up -d --build"

init: sync ## First-time HTTPS setup: certbot + full deploy (run once on a new server)
	$(SSH) $(PROD_HOST) "\
		cd $(PROD_DIR) && \
		$(COMPOSE) down --remove-orphans && \
		docker run --rm \
			-p 80:80 \
			-v /etc/letsencrypt:/etc/letsencrypt \
			-v /var/lib/letsencrypt:/var/lib/letsencrypt \
			certbot/certbot certonly \
			--standalone \
			--email $(EMAIL) \
			--agree-tos \
			--no-eff-email \
			-d $(DOMAIN) && \
		$(COMPOSE) up -d --build"

certbot: ## Obtain SSL certificate and start nginx (use when rate limit has cleared)
	$(SSH) $(PROD_HOST) "\
		cd $(PROD_DIR) && \
		docker run --rm \
			-p 80:80 \
			-v /etc/letsencrypt:/etc/letsencrypt \
			-v /var/lib/letsencrypt:/var/lib/letsencrypt \
			certbot/certbot certonly \
			--standalone \
			--email $(EMAIL) \
			--agree-tos \
			--no-eff-email \
			-d $(DOMAIN) && \
		$(COMPOSE) up -d nginx"

renew-cert: ## Renew SSL certificate
	$(SSH) $(PROD_HOST) "\
		cd $(PROD_DIR) && \
		$(COMPOSE) stop nginx && \
		docker run --rm \
			-p 80:80 \
			-v /etc/letsencrypt:/etc/letsencrypt \
			-v /var/lib/letsencrypt:/var/lib/letsencrypt \
			certbot/certbot renew --standalone && \
		$(COMPOSE) start nginx"

logs: ## Tail logs of all prod services
	$(SSH) $(PROD_HOST) "cd $(PROD_DIR) && $(COMPOSE) logs -f"

ps: ## Show running prod containers
	$(SSH) $(PROD_HOST) "cd $(PROD_DIR) && $(COMPOSE) ps"

xcode: ## Open Xcode with production config (then Product → Archive)
	cd $(ROOT)/mobile && NODE_ENV=production open ios/Frontfaktov.xcworkspace

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

.PHONY: sync deploy init certbot renew-cert logs ps xcode help
