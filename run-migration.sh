#!/bin/bash

# Run database migration
# Usage: ./run-migration.sh

echo "Running database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Run the migration
psql "$DATABASE_URL" -f migrations/add_sms_columns.sql

if [ $? -eq 0 ]; then
    echo "Migration completed successfully!"
else
    echo "Migration failed!"
    exit 1
fi

