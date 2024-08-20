#!/usr/bin/env bash

# verify arguments
set -e
if (( $# != 1 ))
then
  echo "Usage: $0 dump.sql"
  exit 1
fi

PAGER=cat PGPASSWORD=password psql -U postgres -d "${DATABASE_NAME}" -h localhost -v ON_ERROR_STOP=1 -f $1
