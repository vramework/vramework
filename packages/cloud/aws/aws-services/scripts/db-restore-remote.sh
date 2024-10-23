#!/usr/bin/env bash

SECRET_ID="postgres_credentials"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# set up env
. "$DIR/db-common.sh"

# verify arguments
set -e
if (( $# != 1 ))
then
  echo "Usage: $0 dump.sql"
  exit 1
fi

run_psql -f "$1"
