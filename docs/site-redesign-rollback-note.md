# Site Redesign Rollback Note

## Old Site Archive

The version of the site deployed before the retro-modern redesign is preserved on GitHub:

- Repository: `pzepeda25/PatrickZepeda.Com`
- Archive branch: `codex/archive-pre-retro-redesign`
- Preserved from: `origin/main`
- Created: June 6, 2026

This branch is a clean rollback point. Do not delete it when merging or deploying the redesign.

## Roll Back

To restore the old site, merge or reset the deployment branch to:

```text
codex/archive-pre-retro-redesign
```

Review the archived version locally without changing the current working tree:

```bash
git worktree add ../patrick-zepeda-old-site codex/archive-pre-retro-redesign
```
