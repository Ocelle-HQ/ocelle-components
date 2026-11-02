#!/usr/bin/env bash
# Creates ops/NNN-<slug>/ and points Spec Kit's current feature (.specify/feature.json) at it, so the story
# workflow implements and reviews the op like a mission phase. Usage: op-new.sh <slug>
# Prints {"op":"ops/NNN-slug","number":N}.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
slug=${1:-}
[[ "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ && ${#slug} -le 48 ]] || { echo "triage: slug must be lowercase words joined by hyphens, at most 48 characters" >&2; exit 2; }
root=$(triage_root); mkdir -p "$root/ops"
max=0
for d in "$root"/ops/[0-9]*-*/; do [[ -d "$d" ]] || continue; n=${d%/}; n=${n##*/}; n=${n%%-*}; n=$((10#$n)); (( n > max )) && max=$n; done
num=$(printf '%03d' $((max + 1)))
dir="ops/$num-$slug"; mkdir -p "$root/$dir"
printf '{"feature_directory": "%s"}\n' "$dir" > "$root/.specify/feature.json"
printf '{"op":"%s","number":%d}\n' "$dir" "$((10#$num))"
