#!/usr/bin/env bash
# Records that the operator accepted a phase at the escalation gate without an approved review.
# Writes reviews/phase-N/operator-accepted.md naming the round that was accepted; units.sh then
# skips the phase until a newer review round exists.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
# The operator's id comes from OCELLE_OPERATOR or `git config ocelle.operator`, never from git's user.name (an
# agent's environment may set that to the agent). No id: refuse, so no record names the wrong approver.
who=${OCELLE_OPERATOR:-$(git config ocelle.operator || true)}
[[ "$who" =~ ^[A-Za-z0-9._-]{1,64}$ ]] || { echo "set the operator id: git config ocelle.operator <id> (or OCELLE_OPERATOR)" >&2; exit 1; }
story_require_phase "${1:-}"
phase=$1
feature_dir=$(story_feature_dir)
round=$(story_latest_round "$feature_dir" "$phase")
dir="$feature_dir/reviews/phase-$phase"
mkdir -p "$dir"
printf -- '---\nphase: %s\naccepted_round: %s\naccepted_at: %s\naccepted_by: \"human:%s\"\n---\n\nAccepted by the operator at the escalation gate with the review of round %s not approved.\n' \
  "$phase" "$round" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$who" "$round" > "$dir/operator-accepted.md"
printf '{"phase":"%s","accepted_round":%d}\n' "$phase" "$round"
