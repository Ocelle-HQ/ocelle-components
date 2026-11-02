#!/usr/bin/env bash
# Records that the operator accepted the plan with unresolved findings in the latest squad round.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
fd=$(squad_feature_dir); base="$fd/reviews/plan"; r=$(squad_latest "$base" round- ""); dir="$base/round-$r"
k=$(squad_latest "$dir" verify- .md)
printf -- '---\nround: %s\naccepted_verify: %s\naccepted_at: %s\n---\n\nAccepted by the operator with unresolved findings in verify-%s.md.\n' \
  "$r" "$k" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$k" > "$dir/operator-accepted.md"
printf '{"round":%d,"accepted_verify":%d}\n' "$r" "$k"
