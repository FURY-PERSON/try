ROOT          := ../..
STAGE_HOST    := root@5.42.105.253
STAGE_SSH_KEY := $(ROOT)/ssh/stage
STAGE_DIR     := /root/app
DOMAIN        := stage-factfront.duckdns.org
EMAIL         := mikhailhoroshik@gmail.com
COMPOSE       := docker compose -f deploy/stage/docker-compose.yml --env-file deploy/stage/stage.env
SSH           := ssh -i $(STAGE_SSH_KEY) -o ServerAliveInterval=30 -o ServerAliveCountMax=20

sync: ## Sync files to stage server
	rsync -avz --progress \
		--exclude 'node_modules' \
		--exclude '.git' \
		--exclude 'mobile' \
		--exclude '*.log' \
		-e "ssh -i $(STAGE_SSH_KEY)" \
		$(ROOT)/ $(STAGE_HOST):$(STAGE_DIR)

deploy: sync ## Deploy to stage (sync + rebuild and restart all services)
	$(SSH) $(STAGE_HOST) "cd $(STAGE_DIR) && $(COMPOSE) up -d --build"

init: sync ## First-time HTTPS setup: certbot + full deploy (run once on a new server)
	$(SSH) $(STAGE_HOST) "\
		cd $(STAGE_DIR) && \
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
	$(SSH) $(STAGE_HOST) "\
		cd $(STAGE_DIR) && \
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
	$(SSH) $(STAGE_HOST) "\
		cd $(STAGE_DIR) && \
		$(COMPOSE) stop nginx && \
		docker run --rm \
			-p 80:80 \
			-v /etc/letsencrypt:/etc/letsencrypt \
			-v /var/lib/letsencrypt:/var/lib/letsencrypt \
			certbot/certbot renew --standalone && \
		$(COMPOSE) start nginx"

logs: ## Tail logs of all stage services
	$(SSH) $(STAGE_HOST) "cd $(STAGE_DIR) && $(COMPOSE) logs -f"

ps: ## Show running stage containers
	$(SSH) $(STAGE_HOST) "cd $(STAGE_DIR) && $(COMPOSE) ps"

xcode: ## Open Xcode with stage config (then Product → Archive)
	cd $(ROOT)/mobile && NODE_ENV=stage open ios/Frontfaktov.xcworkspace

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

.PHONY: sync deploy init certbot renew-cert logs ps xcode help
