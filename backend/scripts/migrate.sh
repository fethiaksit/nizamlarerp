#!/bin/sh
set -eu

echo "Migration sistemi başlatılıyor..."

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

for file in /migrations/*.up.sql; do
    [ -f "$file" ] || continue

    name="$(basename "$file")"

    applied="$(psql "$DATABASE_URL" -Atqc \
        "SELECT 1 FROM schema_migrations WHERE filename = '$name' LIMIT 1;")"

    if [ "$applied" = "1" ]; then
        echo "SKIP  $name"
        continue
    fi

    echo "APPLY $name"

    psql "$DATABASE_URL" \
        -v ON_ERROR_STOP=1 \
        -1 \
        -f "$file"

    psql "$DATABASE_URL" \
        -v ON_ERROR_STOP=1 \
        -c "INSERT INTO schema_migrations (filename) VALUES ('$name');"

    echo "OK    $name"
done

echo "Tüm migrationlar tamamlandı."
