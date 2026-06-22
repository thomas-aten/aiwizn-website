#!/usr/bin/env bash
# Sync the WakeMed package from the git repo to iCloud Drive.
# Run any time after Claude regenerates artifacts.
#
#   bash /Users/thomasvaidhyan/Documents/GitHub/aiwizn-website/marketing/wakemed/sync_to_icloud.sh
#
# Or alias it:
#   echo "alias wakemed-sync='bash /Users/thomasvaidhyan/Documents/GitHub/aiwizn-website/marketing/wakemed/sync_to_icloud.sh'" >> ~/.zshrc

set -euo pipefail

SRC="/Users/thomasvaidhyan/Documents/GitHub/aiwizn-website/marketing/wakemed"
DEST="/Users/thomasvaidhyan/Library/Mobile Documents/com~apple~CloudDocs/AIWIZN/AIWIZN 2026/AIWIZN POC/Wakemed"

mkdir -p "$DEST/sources"

echo "Syncing WakeMed package: $SRC → $DEST"

# Polished outputs
cp -v "$SRC"/AIWIZN_*.{docx,pptx} "$DEST/" 2>/dev/null || true

# Source markdown
cp -v "$SRC/sources/"*.md "$DEST/sources/" 2>/dev/null || true

# README
[ -f "$SRC/README.md" ] && cp -v "$SRC/README.md" "$DEST/README.md"

echo ""
echo "Synced. iCloud folder now contains:"
ls -la "$DEST/" | tail -n +2
