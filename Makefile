.PHONY: up down test audit breach verify demo

up:
	docker compose -f docker-compose.shield.yml up -d

down:
	docker compose -f docker-compose.shield.yml down

test:
	cd frontend && npm run lint && npm run typecheck && npm run test && npm run build

audit:
	python tools/bayora-audit --compose docker-compose.shield.yml

breach:
	python -m tests.breach.runner --stack both --output results/breach.json

verify:
	python tools/bayora-sample-ledger --output results/ledger.json
	python tools/bayora-verify --ledger results/ledger.json

demo:
	cd frontend && npm run mock
