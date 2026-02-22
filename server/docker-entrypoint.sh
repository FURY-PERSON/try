#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "Seeding database..."
node prisma/seed.js || echo "Seed skipped or already applied"

echo "Starting server as nestjs user..."
exec su-exec nestjs "$@"
