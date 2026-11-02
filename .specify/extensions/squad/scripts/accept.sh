#!/usr/bin/env bash
# Records that the operator accepted the plan with unresolved findings in the latest squad round.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
# The operator's id comes from OCELLE_OPERATOR or `git config ocelle.operator`, never from git's user.name (an
# agent's environment may set that to the agent). No id: refuse, so no record names the wrong approver.
who=${OCELLE_OPERATOR:-$(git config ocelle.operator || true)}
[[ "$who" =~ ^[A-Za-z0-9._-]{1,64}$ ]] || { echo "set the operator id: git config ocelle.operator <id> (or OCELLE_OPERATOR)" >&2; exit 1; }
fd=$(squad_feature_dir); base="$fd/reviews/plan"; r=$(squad_latest "$base" round- ""); dir="$base/round-$r"
k=$(squad_latest "$dir" verify- .md)
printf -- '---\nround: %s\naccepted_verify: %s\naccepted_at: %s\naccepted_by: \"human:%s\"\n---\n\nAccepted by the operator with unresolved findings in verify-%s.md.\n' \
  "$r" "$k" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$who" "$k" > "$dir/operator-accepted.md"
printf '{"round":%d,"accepted_verify":%d}\n' "$r" "$k"
