# Contributing to LeftO Mobile

## Branch Convention

| Branch | Purpose |
|--------|---------|
| `main` | Stable, reviewed code only |
| `feature/xxx` | One branch per feature/task |

All changes go through Pull Requests — no direct pushes to `main`.

---

## Commit Convention

Following [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Setup, config, tooling |
| `refactor:` | Code restructuring |
| `docs:` | Documentation only |

---

## PR Process

1. Create a `feature/xxx` branch from latest `main`
2. Write your code and commit with proper messages
3. Push and open a PR with a clear description
4. Teammate reviews and merges — never merge your own PR

---

## Future Enhancements

- [ ] Tablet (iPad) support — currently locked to phone only
- [ ] Dark mode — currently forced to light mode
- [ ] RTL layout in Expo Go — works in production builds only
- [ ] Eject to bare workflow — only if Firebase or Maps hit a wall in managed Expo