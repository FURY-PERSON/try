ROOT          := ../..
STAGE_HOST    := root@5.42.105.253
STAGE_SSH_KEY := $(ROOT)/ssh/stage
STAGE_DIR     := /root/app
DOMAIN        := stage-factfront.duckdns.org
EMAIL         := mikhailhoroshik@gmail.com
COMPOSE       := docker compose -f deploy/stage/docker-compose.yml --env-file deploy/stage/stage.env
SSH           := ssh -i $(STAGE_SSH_KEY) -o ServerAliveInterval=30 -o ServerAliveCountMax=20
RSYNC_SSH     := ssh -i $(STAGE_SSH_KEY) -o ServerAliveInterval=30 -o ServerAliveCountMax=20

VITE_API_URL  := $(shell grep ^VITE_API_URL $(ROOT)/deploy/stage/stage.env | cut -d= -f2-)

IMAGE_SERVER  := factfront-server:stage
IMAGE_WEB     := factfront-web:stage

sync: ## Sync only deploy configs to stage (docker-compose, nginx, prisma, privacy-policy)
	rsync -avz --progress -e "$(RSYNC_SSH)" \
		$(ROOT)/deploy/stage/docker-compose.yml \
		$(ROOT)/deploy/stage/nginx-proxy.conf \
		$(STAGE_HOST):$(STAGE_DIR)/deploy/stage/
	rsync -avz --progress -e "$(RSYNC_SSH)" \
		$(ROOT)/server/prisma/dump.sql \
		$(ROOT)/server/prisma/migrations/ \
		$(STAGE_HOST):$(STAGE_DIR)/server/prisma/
	rsync -avz --progress -e "$(RSYNC_SSH)" \
		$(ROOT)/privacy-policy/ \
		$(STAGE_HOST):$(STAGE_DIR)/privacy-policy/

build: ## Build Docker images locally (fast — uses your machine's CPU/RAM)
	docker build --no-cache --platform linux/amd64 -t $(IMAGE_SERVER) $(ROOT)/server
	docker build --no-cache --platform linux/amd64 -t $(IMAGE_WEB) --build-arg VITE_API_URL=$(VITE_API_URL) $(ROOT)/web

prune: ## Remove unused Docker images and build cache on stage server
	$(SSH) $(STAGE_HOST) "docker image prune -af && docker builder prune -af"

clean: ## Free disk space: unused Docker data, orphaned volumes, apt cache, old journal logs
	$(SSH) $(STAGE_HOST) "\
		docker image prune -af && \
		docker volume prune -f && \
		docker builder prune -af && \
		apt-get clean && \
		journalctl --vacuum-size=50M"

push-images: prune ## Stream locally-built images to stage server via SSH pipe
	docker save $(IMAGE_SERVER) | gzip | $(SSH) $(STAGE_HOST) docker load
	docker save $(IMAGE_WEB)    | gzip | $(SSH) $(STAGE_HOST) docker load

deploy: sync build push-images ## Full deploy: sync + build locally + push images + restart (no build on server)
	$(SSH) $(STAGE_HOST) "cd $(STAGE_DIR) && $(COMPOSE) up -d --no-build --force-recreate --remove-orphans"

init: sync build push-images ## First-time HTTPS setup: certbot + full deploy (run once on a new server)
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
		$(COMPOSE) up -d --no-build"

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

seed-dump: sync ## Apply reference data SQL dump on stage
	$(SSH) $(STAGE_HOST) "cd $(STAGE_DIR) && \
		docker exec -i \$$($(COMPOSE) ps -q postgres) psql -U factfront factfront_stage \
			-c 'TRUNCATE TABLE \"Category\" CASCADE;' && \
		docker exec -i \$$($(COMPOSE) ps -q postgres) psql -U factfront factfront_stage \
			< server/prisma/dump.sql"

logs: ## Tail logs of all stage services
	$(SSH) $(STAGE_HOST) "cd $(STAGE_DIR) && $(COMPOSE) logs -f"

ps: ## Show running stage containers
	$(SSH) $(STAGE_HOST) "cd $(STAGE_DIR) && $(COMPOSE) ps"

xcode: ## Open Xcode with stage config (then Product → Archive)
	cd $(ROOT)/mobile && NODE_ENV=stage open ios/Frontfaktov.xcworkspace

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

.PHONY: sync build prune clean push-images deploy init certbot renew-cert seed-dump logs ps xcode help
