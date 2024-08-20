#!/usr/bin/env bash

AWS_PROFILE=${AWS_PROFILE:-"default"}
SECRET_ID=${SECRET_ID:-"postgres_credentials"} # defaults to readonly

function require_aws_profile {
    if [[ $(aws configure list-profiles | grep "$1" | wc -l) -lt 1 ]]
    then
        echo "requires an AWS CLI profile name $1"
        exit 1
    fi
}

function get_secret_field {
    echo "${CREDS}" | jq -r ".$1"
}

if [ -z "$DBCREDENTIALS" ]
then
    require_aws_profile "$AWS_PROFILE"
    CREDS="$(echo "$(AWS_PROFILE="$AWS_PROFILE" aws secretsmanager get-secret-value --secret-id postgres_credentials)" | jq '.SecretString |= fromjson | .SecretString')"
else
    CREDS="$(cat "$DBCREDENTIALS")"
fi

function run_psql {
    PAGER=cat PGPASSWORD="$(get_secret_field password)" psql -U "$(get_secret_field user)" -d "${DATABASE_NAME}" -h "$(get_secret_field host)" -v ON_ERROR_STOP=1 $@
}

function run_pg_dump {
    PGPASSWORD="$(get_secret_field password)" pg_dump -d "${DATABASE_NAME}" -h "$(get_secret_field host)" -U "$(get_secret_field user)" $@
}
