#!/bin/sh
set -e
export DATABASE_URL="${DATABASE_URL:-file:/app/data/prod.db}"
mkdir -p /app/data
chown -R nextjs:nodejs /app/data
exec gosu nextjs sh -c 'cd /app && npx prisma db push --schema=./prisma/schema.prisma && exec node server.js'
