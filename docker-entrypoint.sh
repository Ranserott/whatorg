#!/bin/sh
set -e

echo "Starting WhatsApp Audit Dashboard..."

# Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate deploy || {
  echo "Migration failed. Retrying in 5 seconds..."
  sleep 5
  npx prisma migrate deploy
}

echo "Migrations completed successfully."

# Execute the main command
exec "$@"
