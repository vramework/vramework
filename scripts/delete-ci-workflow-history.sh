username="$1"
reponame="$2"

if [[ -z "$username" || -z "$reponame" ]]; then
    echo "Usage: delete_workflow_runs <username> <reponame>"
    exit 1
fi

echo "Fetching workflow runs for $username/$reponame..."

runs=$(gh api /repos/"$username"/"$reponame"/actions/runs | jq -r '.workflow_runs[] | [.id] | @tsv')

if [[ -z "$runs" ]]; then
    echo "No workflow runs found."
    return 0
fi

for value in $runs; do
    echo "Deleting workflow run ID $value"
    gh api -X DELETE /repos/"$username"/"$reponame"/actions/runs/"$value"
done

echo "All workflow runs deleted."
