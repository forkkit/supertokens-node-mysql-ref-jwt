# Hooks

## Pre-commit hooks

### Installation
```bash
sudo -s # required because the installer below installs prettier in the global context
cd hooks && ./pre-commit-hook-install.sh
```

### What it does
- Stashes un-added and untracked changes
- Checks for TS compilation errors
- Checks for formatting issues in .js and .ts files
- Unstashes the stashed contents if any and drop the stash
- If there are no errors, then proceeds to commit
