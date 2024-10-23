#!/usr/bin/env bash

AWS_PROFILE=${AWS_PROFILE:-"default"}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# set up env
. "$DIR/db-common.sh"

DATE="$(date "+%Y-%m-%d_%H:%M:%S")"
DUMP_FILE="pg_dump_$(get_secret_field database)_$DATE.sql"

# first, dump audit schema without data (schema only)
# echo "DROP SCHEMA IF EXISTS audit CASCADE;" >> "$DUMP_FILE"
# run_pg_dump -n audit -s --no-owner --no-acl --format p >> "$DUMP_FILE"

# then, dump app schema
echo "DROP SCHEMA IF EXISTS app CASCADE;" >> "$DUMP_FILE"
run_pg_dump -n app --no-owner --no-acl --format p >> "$DUMP_FILE"

# finally, dump the migrations table
echo "DROP TABLE IF EXISTS public.migrations;" >> "$DUMP_FILE"
run_pg_dump -t public.migrations --no-owner --no-acl --format p >> "$DUMP_FILE"
