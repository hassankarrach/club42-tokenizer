# Agent guidance

Read `PLAN.md` for decisions, status, requirements, and remaining work.

- Explain details step by step and check understanding before advancing; this is the user's explicit preference.
- Preserve the fixed-supply Club42 design unless the user requests a change.
- Keep source/tests in `code/`, deployment materials in `deployment/`, documentation in `documentation/`, and optional React code in `client/`.
- Run `npm test` for contract/test changes. Use `npm run compile` to build.
- Do not claim mandatory completion before public testnet deployment, explorer publication, and complete documentation.
- Never commit secrets, wallet keys/recovery phrases, .env files, dependencies, or generated artifacts.
- Use test networks, no real funds. User controls wallet signing.
- GitHub is a private working copy. School submission is separate; do not overwrite remotes or submit without the user's request.
- Update PLAN.md and README.md after material progress.
