# Club42 continuation plan

Updated 2026-10-12. Read this file before continuing on the school machine.

## Goal and teaching preference

Complete 42 Tokenizer subject v1.1 with the Club42 theme, then the optional React/MetaMask client and multisig bonus. The user knows C/C++ and previously worked on an NFT minting app, but wants blockchain and Solidity explained from basics. Explain one concept at a time and check understanding before advancing. The user must understand and defend submitted code.

## Agreed design

- Name: Club42; symbol: CLUB42; standard: ERC-20.
- Fixed supply: 42,000 tokens with 18 decimals, created during deployment and assigned to the deploying wallet.
- No public mint, burn, owner, freezing, seizure, voting, or redemption function.
- Standard transfers and allowance-based spending come from OpenZeppelin ERC20.
- Theme: internal club credits held in member wallets. Members independently verify balances and authorize transfers.
- The deployer initially controls the reserve. Collective treasury control is NOT implemented; the future multisig bonus will provide it.

## Current implementation

- `code/Club42.sol`: base token, OpenZeppelin Contracts 5.4.0.
- `code/tests/token.cjs`: ethers 6.15.0 plus in-memory Ganache 7.9.2 tests.
- `deployment/compile.cjs`: solc 0.8.30, optimizer 200 runs, Paris EVM target; generates ignored `artifacts/Club42.json` containing ABI and bytecode.
- `documentation/concept.md` and `documentation/local-testing.md`: initial explanations.
- `client/`: local React/Vite wallet implemented; see implementation status below.
- `deployment/`: compiler plus the local MetaMask deployment tooling described below.
- Update: `deployment/serve.cjs`, `index.html`, and `deploy.js` now provide a localhost-only MetaMask deployment page via `npm run deploy:local`. It uses the compiled artifact and installed ethers bundle, checks Sepolia/account, estimates fees, and requires user-controlled signing. It displays deployment identifiers and checks initial supply/balance after confirmation. User completed deployment through Brave/MetaMask. Pre-deployment balance was 0.0500 SepoliaETH.
- Public network: Sepolia. Etherscan source verification confirmed as Exact Match.
- Public deployment update: user signed deployment on Sepolia (11155111). Etherscan reports success in block 11888821, transaction `0x5f2e5deecf70da9a1d0c9d97cdc267cdd9928c5403d8d911639e17c904812e5f`, contract `0x200c145609fDC02067f8b629368BA397153B9598`. Deployment log records issuance of 42,000 × 10^18 units to the project account. Record saved in `deployment/sepolia.json`. Etherscan source verification succeeded (Exact Match), independently checked on the public contract page. Current balance/supply readback, public interaction demonstration, and complete documentation remain to be confirmed/completed.
- Local behavioral tests passed again before the handoff on 2026-10-11. Mandatory submission is NOT finished.

## Resume on the school machine

1. Clone this private repository using the user's own GitHub authentication. Do not copy credentials from another machine.
2. Start with Node.js 22 LTS; original tests passed on Node 22.9.0. Record the school machine's version.
3. Run `npm ci`, then `npm test`. `npm run compile` compiles separately.
4. Tests require no MetaMask, public RPC, private key, or real funds. They deploy on a disposable in-memory chain.
5. Native acceleration warnings may fall back to JavaScript; confirm exit code and assertions. Investigate actual failures rather than suppressing them.
6. Keep dependencies, generated artifacts, and secrets out of Git.
7. The lockfile marks Ganache's bundled macOS-only fsevents package optional. Actual school Linux installation and tests passed on 2026-10-11 using Node 22.23.3, without sudo. Ganache reported a native acceleration warning and successfully used its JavaScript fallback.
8. This checkout has the official Linux x64 Node 22.23.3 binary in ignored `.tools/`, with its archive SHA-256 checked against the official release checksums. In each new terminal, from the project root, run `export PATH="$PWD/.tools/node-v22.23.3-linux-x64/bin:$PATH"`. The system Node 12.22.9 cannot run the compiler. Dependencies were installed with `npm ci --cache /tmp/club42-npm-cache --no-audit --no-fund`; no new dependency audit was performed.

## Next work, in order

React client implementation: `client/src/main.jsx` and `style.css`, served with Vite via `npm run client:dev`, now connect MetaMask (including EIP-6963 discovery), check/switch Sepolia, read balance/supply, send tokens, grant/revoke approvals, read allowances, and perform delegated transfers. Amounts use readable decimal tokens. Pending/error/confirmation states and explorer links are present; account/network events invalidate stale reads. No keys or deployment bytecode are bundled. Production build and local HTTP/module serving passed. Browser wallet checks and user review remain pending. User reported recipient `0xe8Ef80B64D6111523c2C96485dcD1B7D847E3f9b` holds 100 CLUB42 after public transfer; exact transaction routing/revert cause was not established.

Explorer verification preparation: `npm run verification:input` generates ignored `artifacts/Club42.standard-input.json` with all six literal sources and exact compiler settings. Self-contained recompilation matched the existing artifact. Upload completed; Etherscan confirms Source Code Verified (Exact Match).

### 1. Explain and reproduce the existing code

Walk through inheritance, constructor, msg.sender, decimals, transfers, approve, and transferFrom. Distinguish student code from library code. Explain the tests and run them before changing the implementation.

Tests cover name/symbol/decimals, initial supply and deployer balance, transfer balances and unchanged supply, overspending, zero-address recipients, spending without approval, allowance creation, delegated spending, allowance exhaustion, revocation, and absence of a public mint function. Expected failures use simulated static calls and inspect the expected contract error. Successful actions send transactions and wait for receipts.

### 2. Complete mandatory public deployment

Choose an EVM public testnet with the user. Check current official network, RPC, faucet, and explorer documentation. No mainnet or real funds are needed. Local Ganache alone does not satisfy public deployment.

Implement reproducible deployment using the existing ethers/compiler stack if suitable; avoid an unnecessary second toolchain. Provide placeholder-only `.env.example` if needed. Never ask for a recovery phrase or private key in chat. Keep local signing under user control and use a disposable test wallet.

Deploy and confirm the receipt; read metadata, supply, and recipient balance. Publish/verify on the explorer with the exact compiler and settings. Only then record network, contract address, deployment transaction, and explorer link in Git.

### 3. Finish mandatory documentation and defense

Finish the root README's design rationale and reproducible setup/test/deployment instructions. Document purpose, functions, units, ownership/permissions, security assumptions, and user interaction. Rehearse two-wallet transfers, approvals, delegated transfers, and rejected operations. A video is optional and gives no additional grade under v1.1.

### 4. Optional React client

Keep it in `client/`. Minimal scope: MetaMask connection, network check, account/balance/supply, transfers, pending/success/failure states, explorer links, and account/network change handling. Add approval interactions if useful. No mint button: the agreed token is fixed supply. Contract rules enforce permissions, not hidden UI elements.

### 5. Optional multisig bonus

Mandatory must work fully first. Plan distinct authorized signers and a threshold such as 3-of-5. Protect treasury token distributions; do not invent administrator minting. Explain the intended design against the actual current evaluation sheet if available: no public correction sheet was verified in the previous session.

Test signer/threshold validation, unauthorized and duplicate approvals, insufficient approvals, successful execution, replay prevention, and token movement. Explain any reserve transfer to the multisig before the user signs it. Update documentation and client for proposal/approval/execution.

## Subject requirements from the user's pasted v1.1

The full user-provided subject text is preserved in `documentation/subject-v1.1.txt` (received 2026-10-11). It confirms the requirements below. BNB Chain appears in the preamble, but the mandatory part explicitly permits choosing the blockchain and language. React is an optional project extension, not a subject requirement. The separate evaluation sheet has not been provided.

- Token name contains 42 and is not insulting.
- Blockchain/language are free choices, but the appropriate token standard must be respected.
- Root README explains choices and reasons.
- Root `code/` contains readable, commented source for code review.
- Separate deployment materials folder; we use `deployment/`.
- Public blockchain deployment; test networks avoid real money.
- Define ticker, publish on an explorer, and record network/address in the repository.
- Root `documentation/` explains what the token represents, how it works, and usage.
- Demonstrate operations and explain ownership, privileges, and security.
- Multisig bonus is assessed only if the mandatory part is fully working.

## Limitations and submission

This repository contains the user-provided full subject text for v1.1 and a requirements summary, not the original PDF or evaluation sheet. Recheck against any newer school subject and the evaluation sheet when available. npm reported audit findings in development dependencies; review before using beyond the local harness. Passing tests is not an audit or guaranteed evaluation acceptance.

GitHub is a private working/transfer copy. Submitting to the school's repository is a separate user-authorized step; preserve GitHub origin and add a separate school remote when requested.

## Suggested prompt for the next Codex agent

Read AGENTS.md and PLAN.md, inspect Club42, and run npm ci and npm test. Explain one concept at a time and check my understanding. Then help complete public testnet deployment and documentation, followed by the optional React client and multisig bonus.

2026-10-12 account-switch fix: the connected-account button now says Switch account and explicitly requests MetaMask eth_accounts permissions before refreshing, allowing users to authorize a second account. Existing accountsChanged handling remains. Real wallet switching needs user verification.

2026-10-12: user confirmed public client balances 41,890/110 CLUB42 after delegated spending of 10; remaining allowance 15, then revocation to 0. A subsequent simulated delegated transfer reverted with an unknown custom error. Added ERC-20 error ABI fragments and readable messages; exact live error decoding awaits user retry.

Client UX: user confirmed decoded insufficient-allowance rejection after revocation. Errors now use a red activity panel and an explicit Error label with alert semantics; informational notices retain the normal style.

## Documentation cleanup — 2026-10-12

Rewrote root, documentation, deployment, and client guides for brevity; removed stale pending-network/deployment claims and repetition. Added documentation/usage.md for operations and the user-confirmed public demonstration. Concept covers functions, units, privileges, allowance risks, and key/gas limits. Preserved the subject verbatim. Public source is verified; local tests and client build previously passed. Remaining: final requirements/defense review, optional manual wrong-network/cancellation checks, optional multisig, and separate user-authorized school submission. Public demonstration observations are distinguished from independently checked transaction evidence.

2026-10-12 UI refresh: fixed 100vh/100dvh shell with internal scrolling, compact header/activity/footer, black wallet card with curved lime gradient artwork, overlapping circles, and token-denominated balance. Palette applied throughout. Responsive single-column layout preserves access on small screens. Client build passed; visual review in Brave remains pending. User intends to implement multisig after revision.

Branding: cropped the user-provided client/logo-source.png without regenerating artwork. PNG emblem and wordmark are in client/public/; linked favicon/touch icon and header logo. Original light background retained for black artwork readability. Wallet card unchanged.

UI preference update: restored the light application theme at the user’s request; reference wallet card and transparent PNG branding retained.

Added client/public/bg.mp4 as a muted autoplay/loop/playsInline background with a 90%-opaque light overlay, noninteractive layering, and a reduced-motion static fallback. Wallet card unchanged.

Video compatibility: confirmed original bg.mp4 is HEVC; converted to bg-h264.mp4 with H.264/yuv420p and fast-start MP4, removed audio, preserved original. Client now uses the converted file; overlay remains 0.9.

Background overlay updated to a pale sage → cream-green → lime gradient with 82–94% opacity, matching the light app palette.

UI polish: actions panel uses translucent glass with blur and a white 0.01-alpha border; wallet connection button uses a sage/lime gradient. Removed the bottom footer entirely.

UI adjustment: reverted the right panel glass effect to its previous solid light surface; retained gradient wallet connection button and removed footer.

Card artwork now includes a muted looping H.264 video clipped to the existing curved green shape, with the original gradient overlaid for legibility and a reduced-motion fallback.

UI feedback placement: moved notifications/errors and transaction links from the standalone bottom bar into the bottom of the right operation panel.

## Next session handoff — 2026-10-12

User requested saving to GitHub main and continuing tomorrow. Mandatory implementation, public Sepolia deployment/source verification, concise documentation, and user-confirmed public operation demonstration are in place. Multisig is explicitly planned, not implemented. No school submission is authorized.

Resume mock correction one question at a time. Last unanswered question: What is gas, and why does the member need SepoliaETH even when it owns CLUB42? Cover blockchain/keys/transactions, EVM and contract code, ERC-20 permissions, tests/compiler/ABI, public deployment, and security; then tricky scenarios. No verified correction sheet found publicly.

Remaining phases:
1. Finish the concept/code defense review and any identified fixes.
2. Design the multisig bonus together (signers/threshold and treasury-only token distribution; preserve fixed token supply).
3. Implement and test multisig authorization, duplicate approvals, threshold, execution, replay prevention, and token movement.
4. Deploy/verify multisig on testnet with user signing; explain and obtain authorization before any treasury reserve transfer.
5. Add React proposal/approval/execution flows and document the bonus. Rehearse with distinct signers.
6. Final subject checklist, wallet wrong-network/cancellation and responsive UI review, final tests/build, and separate school submission when requested.

Latest UI: light app, black/lime reference card, transparent PNG logos, H.264 looping video with sage/lime overlay, card video clipped through CSS (visual check remains), gradient dividers/connect button, solid right panel with bottom margin and embedded activity/errors. Original media retained as source assets; node_modules, .tools, and build artifacts remain ignored.
