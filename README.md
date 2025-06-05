# Mercury Financials

## Prerequisite
- [Ubuntu](https://ubuntu.com/download/server)
- [Make](https://askubuntu.com/questions/161104/how-do-i-install-make)
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- Docker ([Part-1](https://docs.docker.com/engine/install/ubuntu/) & [Part-2](https://docs.docker.com/engine/install/linux-postinstall/))

## Local Install
- Open terminal and type `cd $HOME/Desktop`
- Clone repo `git clone https://github.com/cardano-mercury/mercury-financials.git`
- Switch to repo dir `cd $HOME/Desktop/mercury-financials`
- Copy `application/.env.example` as `application/.env` (then make necessary changes to `.env` file)
- Run `make build` to build & start the containers
- Application should be running locally at `http://localhost:8600`

### Available Make Commands (Local Development)
* `frontend-build` Rebuild frontend
* `frontend-watch` Runs `npm run dev` (vite watch/hot-reload mode) inside _mercuryfinancials-web_ container
* `frontend-upgrade` Upgrades npm packages inside _mercuryfinancials-web_ container
* `up` Restart all docker containers
* `down` Shutdown all docker containers
* `build` Rebuilds all docker containers (using cache)
* `rebuild` Rebuilds all docker containers (without cache)
* `composer-install` Run composer install
* `db-migrate` Run database migration(s)
* `db-refresh` Drop all database tables, re-run the migration(s) with seeds
* `tinker` Starts a new php artisan tinker session
* `status` View the status of all running containers
* `logs` View the logs out of all running containers
* `logs-web` View the logs out of `mercuryfinancials-web` container only
* `logs-horizon` View the logs out of `mercuryfinancials-horizon` container only
* `logs-cron` View the logs out of `mercuryfinancials-cron` container only
* `shell` Drop into an interactive shell inside _mercuryfinancials-web_ container
* `stats` View the resource usage of all running containers
* `artisan` Execute Laravel `artisan` command inside _mercuryfinancials-web_ container (e.g. usage: `make artisan COMMAND="make:model MyModel -m"`)

### Local Dev MySQL Container Connection Info
```
Host: 127.0.0.1
Port: 36000
User: mercuryfinancials
Database: mercuryfinancials
Password: 123456
```

### Local Queue Dashboard
```
Visit: http://localhost:8600/horizon
```
