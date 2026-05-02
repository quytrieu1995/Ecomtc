#!/usr/bin/env bash
# Chạy trên máy dev hoặc VPS khi KHÔNG dùng Docker (cần Node 20+).
# Triển khai bằng container: xem deploy/DOCKER.md và docker compose build.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> npm ci / install"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> prisma generate + next build"
npx prisma generate
npm run build

echo "==> gói standalone vào .deploy/"
rm -rf .deploy
mkdir -p .deploy
cp -a .next/standalone/. .deploy/
mkdir -p .deploy/.next/static
cp -a .next/static/. .deploy/.next/static/

# Prisma engine trong standalone (SQLite / client)
mkdir -p .deploy/node_modules/.prisma
if [[ -d node_modules/.prisma/client ]]; then
  cp -a node_modules/.prisma/client .deploy/node_modules/.prisma/
fi
mkdir -p .deploy/node_modules/@prisma
if [[ -d node_modules/@prisma/client ]]; then
  cp -a node_modules/@prisma/client .deploy/node_modules/@prisma/
fi

mkdir -p .deploy/prisma
cp prisma/schema.prisma .deploy/prisma/

echo "==> xong. Thư mục chạy production: $ROOT/.deploy (server.js)"
ls -la .deploy | head
