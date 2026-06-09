default:
    @just --list

setup:
    pnpm install --frozen-lockfile

build:
    pnpm build

check:
    pnpm check

dev:
    pnpm dev

lint:
    pnpm lint

test:
    pnpm test
