#!/usr/bin/env bash

AWS_PROFILE=${AWS_PROFILE:-"default"}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# set up env
. "$DIR/db-common.sh"

if [ -z "$1" ]
then
    run_psql
else
    run_psql -f "$1"
fi
