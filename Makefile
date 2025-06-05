export COMPOSE_PROJECT_NAME=mercuryfinancials
export COMPOSE_FILE=docker/docker-compose.yml

.SILENT: up
up:
	$(MAKE) down
	docker compose up -d
	$(MAKE) composer-install
	./docker/wait-for-mysql.sh
	$(MAKE) db-migrate
	$(MAKE) frontend-build

.SILENT: down
down:
	docker compose down --remove-orphans

.SILENT: build
build:
	docker compose build
	$(MAKE) up
	$(MAKE) frontend-build

.SILENT: rebuild
rebuild:
	docker compose build --pull --no-cache
	$(MAKE) up

#
# Helper functions
#

.SILENT: frontend-build
frontend-build:
	docker exec -it mercuryfinancials-web bash -c "npm install && npm run build"

.SILENT: frontend-watch
frontend-watch:
	docker exec -it mercuryfinancials-web bash -c "npm install && npm run dev"

.SILENT: frontend-upgrade
frontend-upgrade:
	docker exec -it mercuryfinancials-web bash -c "npm update"

.SILENT: composer-install
composer-install:
	docker exec -it mercuryfinancials-web bash -c "composer install"

.SILENT: db-migrate
db-migrate:
	docker exec -it mercuryfinancials-web bash -c "php artisan migrate"

.SILENT: db-refresh
db-refresh:
	docker exec -it mercuryfinancials-web bash -c "php artisan migrate:fresh --seed"

.SILENT: tinker
tinker:
	docker exec -it mercuryfinancials-web bash -c "php artisan tinker"

.SILENT: status
status:
	docker compose ps

.SILENT: logs
logs:
	docker compose logs -f --tail=100

.SILENT: logs-web
logs-web:
	docker compose logs -f --tail=100 mercuryfinancials-web

.SILENT: logs-horizon
logs-horizon:
	docker compose logs -f --tail=100 mercuryfinancials-horizon

.SILENT: logs-cron
logs-cron:
	docker compose logs -f --tail=100 mercuryfinancials-cron

.SILENT: shell
shell:
	docker exec -it mercuryfinancials-web bash

.SILENT: stats
stats:
	docker stats mercuryfinancials-web mercuryfinancials-mysql mercuryfinancials-redis mercuryfinancials-horizon mercuryfinancials-cron

.SILENT: artisan
# Usage: make artisan COMMAND="make:model ModelName -mf"
artisan:
	docker exec -it mercuryfinancials-web bash -c "php artisan $(COMMAND)"
