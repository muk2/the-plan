.PHONY: build build-backend build-frontend dev dev-backend dev-frontend run stop clean service-install service-start service-stop service-logs

# ── Production ──────────────────────────────────────────────

build: build-frontend build-backend

build-backend:
	cd backend && cargo build --release

build-frontend:
	cd frontend && npm install && npm run build

run: build
	@echo "Starting The Plan on http://localhost:3000"
	@echo "Tailscale: http://$$(hostname):3000"
	cd backend && ./target/release/the-plan-backend

stop:
	@pkill -f the-plan-backend 2>/dev/null && echo "Stopped" || echo "Not running"

# ── Development (hot reload) ────────────────────────────────

dev:
	@echo "Starting backend + frontend dev servers..."
	@make dev-backend &
	@sleep 2
	@make dev-frontend

dev-backend:
	cd backend && cargo watch -x run 2>/dev/null || (cd backend && cargo run)

dev-frontend:
	cd frontend && npm run dev

# ── Utilities ───────────────────────────────────────────────

clean:
	cd backend && cargo clean
	rm -rf frontend/dist frontend/node_modules

# ── Server control (no launchd needed) ──────────────────────

start:
	@./scripts/theplan start

stop:
	@./scripts/theplan stop

restart:
	@./scripts/theplan restart

status:
	@./scripts/theplan status

logs:
	@./scripts/theplan logs

rebuild:
	@./scripts/theplan rebuild

# ── macOS launchd service (optional) ────────────────────────

service-install:
	./scripts/install-service.sh

service-start:
	launchctl load ~/Library/LaunchAgents/com.theplan.server.plist

service-stop:
	launchctl unload ~/Library/LaunchAgents/com.theplan.server.plist

service-logs:
	tail -f logs/server.log

# Reset database (DESTRUCTIVE - removes all data)
reset-db:
	@read -p "This will DELETE all user data. Are you sure? [y/N] " yn; \
	if [ "$$yn" = "y" ]; then \
		rm -f backend/data/theplan.db backend/data/theplan.db-shm backend/data/theplan.db-wal; \
		echo "Database reset."; \
	fi
