#!/usr/bin/env bash
# Sync ALL AIWIZN marketing packages from the git repo to iCloud Drive.
# Mirrors marketing/* → ~/Library/Mobile Documents/com~apple~CloudDocs/AIWIZN/AIWIZN 2026/AIWIZN POC/<Subfolder>/
#
# Run any time after Claude regenerates artifacts:
#
#   bash /Users/thomasvaidhyan/Documents/GitHub/aiwizn-website/marketing/sync_to_icloud.sh
#
# Or alias:
#   echo "alias aiwizn-sync='bash /Users/thomasvaidhyan/Documents/GitHub/aiwizn-website/marketing/sync_to_icloud.sh'" >> ~/.zshrc

set -euo pipefail

SRC_ROOT="/Users/thomasvaidhyan/Documents/GitHub/aiwizn-website/marketing"
DEST_ROOT="/Users/thomasvaidhyan/Library/Mobile Documents/com~apple~CloudDocs/AIWIZN/AIWIZN 2026/AIWIZN POC"

# Map subfolder → iCloud destination folder name.
declare -A FOLDERS=(
  [wakemed]="Wakemed"
  [ai-readiness]="AI Readiness"
)

for sub in "${!FOLDERS[@]}"; do
  src="$SRC_ROOT/$sub"
  dest="$DEST_ROOT/${FOLDERS[$sub]}"
  if [ ! -d "$src" ]; then
    echo "  (skip) $src not present"
    continue
  fi
  mkdir -p "$dest"
  [ -d "$src/sources" ] && mkdir -p "$dest/sources"

  echo "→ Syncing $sub: $src → $dest"
  cp -v "$src"/*.{docx,pptx,pdf,md} "$dest/" 2>/dev/null || true
  if [ -d "$src/sources" ]; then
    cp -v "$src/sources/"*.md "$dest/sources/" 2>/dev/null || true
  fi
  [ -f "$src/README.md" ] && cp -v "$src/README.md" "$dest/README.md"
done

echo ""
echo "Done. iCloud now contains:"
for sub in "${!FOLDERS[@]}"; do
  dest="$DEST_ROOT/${FOLDERS[$sub]}"
  if [ -d "$dest" ]; then
    echo "  $dest:"
    ls "$dest" 2>/dev/null | sed 's/^/    /'
  fi
done
