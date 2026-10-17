# Club42 continuation plan

Updated 2026-10-17. Read before continuing.

## User preferences and constraints

Explain one concept at a time and check understanding. The user wants to defend their code, with a mock correction covering fundamentals through tricky implementation/security questions. A user-provided correction sheet is saved in documentation/correction-sheet.txt, with provenance and preparation notes in documentation/correction-sheet-notes.md. Its official status/version is unverified; full provided subject v1.1 is in documentation/subject-v1.1.txt.

Preserve fixed supply. Source/tests belong in code/, deployment tools in deployment/, docs in documentation/, React in client/. Testnets only; user signs in MetaMask. Never commit secrets, .env, dependencies, .tools, or generated build artifacts. GitHub origin is a private working copy; school submission is separate and requires an explicit request.

## Implemented and demonstrated

- Club42.sol: OpenZeppelin ERC-20 5.4.0, symbol CLUB42, 18 decimals, 42,000 tokens created for the deployer. No later minting, public burn, privileged owner, seizure, freezing, voting, or redemption.
- Sepolia token: 0x200c145609fDC02067f8b629368BA397153B9598. Source verified Exact Match. Record: deployment/sepolia.json.
- User demonstrated transfer of 100, approval of 25, delegated spending of 10, revocation to zero, and insufficient-allowance rejection. Original/member balances were 41,890/110 before treasury funding; these are historical observations.
- Club42Treasury.sol: immutable token, three fixed distinct organizers, two distinct approvals required. Organizer-only proposal/approval/execution. Proposing grants no approval. Recipient/amount fixed; duplicate approvals and execution replay rejected. SafeERC20 transfer; failure rolls back execution flag.
- Treasury: 0xd433D14b92c44A608607590eb323BEd9F368D6F4 on Sepolia. Deployed and source verified Exact Match. User authorized/signed 1,000 CLUB42 funding; successful receipt, event, and balance checked independently. Record: deployment/treasury-sepolia.json.
- No signer rotation, cancellation, approval withdrawal, expiry, or asset recovery. Losing two keys can lock funds. Two compromised organizers can spend the reserve. Approved proposals do not reserve funds. Limitations documented.

## Organizers

1. Club42: 0xA798E1210b6e5803Bf491944713Bb5BB5ed3D330
2. Member: 0xe8Ef80B64D6111523c2C96485dcD1B7D847E3f9b
3. Organizer 3: 0xE270edD9ad1F223Fd0e393c809EA6C417818f188

All are user-controlled demonstration accounts; real governance requires independently controlled keys. User reported third account funded with 0.002 SepoliaETH.

## Tooling and client

Use Node 22.23.3 installed in ignored .tools/ (system Node 12 is too old):

```sh
export PATH="$PWD/.tools/node-v22.23.3-linux-x64/bin:$PATH"
npm ci
npm test
npm run client:dev
```

Client: http://127.0.0.1:5173 in Brave. Compiler: solc 0.8.30, optimizer 200 runs, Paris EVM. npm test compiles and runs token/treasury suites. Ganache native warning falls back successfully to JavaScript. npm run client:build builds React.

Deployment UI: run npm run client:dev and open http://127.0.0.1:5173/deploy; choose token or treasury. The standalone deployment server was removed. Client dev/build commands compile contracts automatically. Both contracts already deployed; avoid accidental redeployment. npm run verification:input -- Club42Treasury creates ignored JSON plus encoded constructor arguments; token verification uses command without the argument.

React token operations and account switching were exercised. Treasury.jsx now reads balance/organizer status/proposals with ten-item pages and 15-second refresh, and provides signer-controlled propose/approve/execute with simulation, shared transaction lock, signer/network checks, and explorer/error feedback. Browser treasury flow is not yet demonstrated.

UI: light fixed-viewport app with internal scrolling, preserved black/lime wallet card, transparent PNG branding, looping H.264 video with sage/lime overlay, card video clipping, gradient dividers/connect button, solid right panel with bottom margin and embedded activity. No hosting configured.

## Resume here: remaining work

1. Open client and Treasury tab; connect original account on Sepolia. Confirm 1,000 CLUB42, organizer status, no proposals (if unchanged).
2. User chooses/authorizes a distribution (suggest 100 CLUB42 to Member). Create proposal; approve separately with first organizer; verify only one approval cannot execute. Switch to second organizer, approve, execute, and independently check receipt/balances. Record transaction hashes. Check duplicate/replay and non-organizer UI behavior; automated contract tests already cover these.
3. Finalize public bonus demonstration documentation. Wrong-network/cancellation and responsive UI wallet checks still need review. Tests/build are required before final push.
4. Resume mock correction and contract walkthrough. User understood modifiers/constructor and proposal storage, then deferred code review. Gas confusion resolved: gas measures work; ETH fee includes burned base fee and proposer tip. Cover treasury functions, failed calls, permissions, tests, deployment, and key/security assumptions.
5. Review supplied subject requirements and separate correction sheet if acquired. Bonus is not finished until public demonstration and final review. Submit to school only when explicitly requested; preserve GitHub origin.

## Save request

User requested updating documentation/handoff and pushing current changes to GitHub main on 2026-10-14, then continuing later. No public treasury proposal, approval, or execution has been demonstrated yet.

## Public bonus demonstration — 2026-10-15

User created proposal #0 for 100 CLUB42 to Member, approved with original account and Organizer 3, then executed with Organizer 3. Independently checked successful tx 0xadf30fa7e1bef0bb8ee4575e31901d47319c16e8df8e4fdfe6ff6ba60a6a35bb (block 11917202), treasury Executed event, token Transfer event, proposal executed=true with two approvals. Treasury balance 900, member 210, total supply 42,000. Read-only replay simulation rejects AlreadyExecuted. Receipt outer destination is wallet routing contract; treasury event/state confirms execution. Initial unsuccessful wallet attempt had no confirmed failed treasury execution receipt; cause unresolved. Demonstration saved in deployment/treasury-sepolia.json. Remaining: final documentation/status cleanup, final tests/build and requested push, wallet edge-case review, code defense preparation and separate submission.

## Integrated deployment UI — 2026-10-16

Token and treasury deployment now share the React client at `/deploy` and its wallet connection. Materials remain in deployment/; the subject does not require the UI source there. Fee estimation, Sepolia/account checks, submission locking, explorer links, and initial-state readback are included. Existing deployment records are not automatically overwritten. Standalone deployment web assets/server and deploy:local command removed. Manual wallet rehearsal remains pending; no fresh public deployment was performed for this change. Bash/Zsh startup files on this machine now select the project-local Node 22 automatically.

Validation: `npm run client:build` passed (including automatic contract compilation), `git diff --check` passed, and the dev server returned the client entry point for `/deploy`. Wallet signing/cancellation and account/network-change flows require manual browser review.

## Correction sheet saved — 2026-10-16

Preserved the full user-pasted EvalHub Tokenizer checklist in documentation/correction-sheet.txt. Provenance and subject comparison are in documentation/correction-sheet-notes.md. Prepare for live redeployment during correction; guided user rehearsal is still pending. User requested saving and pushing the current work to the existing private GitHub origin; school submission remains separate.

## Learning and correction routes — 2026-10-16

User approved two client routes: `/documentation` for structured learning and `/correction` for phased correction sessions with freshly deployed contracts. Implemented ten learning chapters, SHA-256 block-link, gas and allowance labs, expandable defense answers, actual contract source and saved subject/checklist text. These are original teaching illustrations; hash links do not replace consensus, and Ethereum proof of stake is distinguished from mining.

Correction includes preparation, token deployment, explorer/verification, initial-state reads, token tests, optional multisig and JSON export. Owner sends 100, approves 25, member spends 10, owner revokes and member simulates an exact insufficient-allowance rejection. Receipt events and before/after block-state comparisons are recorded. Manual checks remain explicitly manual. Treasury deployment accepts the session token and chosen three organizers, with separate funding, two approvals, execution and simulated one-approval/replay rejection checks. Session-specific constructor encoding is displayed for explorer verification. The original dashboard and deployment records stay linked to the original contracts; fixed-supply contracts are unchanged.

Session records persist in browser localStorage, including submitted deployments and their hashes, with receipt recheck/direct deployment recovery and JSON export before a new session. Export is needed when changing school machines. No JSON import or multi-session browser library is implemented. Full usage/limits: documentation/client-learning-and-correction.md.

Validation: npm run client:build and npm test passed. Disposable jsdom/Ganache simulated-wallet rehearsal passed documentation labs, complete token deployment/operations/state-event checks, session treasury deployment/funding/two approvals/execution and expected rejections, plus session restoration after navigation, simulated wrong-network write gating and cancelled wallet signing. No real browser visual QA or new public Sepolia deployment occurred. Remaining: real MetaMask cancellation/account/network-change checks, responsive browser review, source verification/public-session rehearsal and code defense. The correction sheet remains unofficial/unverified; the subject does not explicitly prescribe three redeployments.

## Scrollbar styling — 2026-10-16

Applied shared sage tracks and rounded green/lime scrollbar thumbs across the app shell, nested panels, source blocks and textareas. Chromium/WebKit receive hover/drag states; Firefox uses standard thin scrollbar colors. Forced-colors mode retains native styling. Production client build and whitespace checks passed; visual browser review remains pending.

## Documentation audience clarified — 2026-10-16

User clarified that /documentation is a presentation and explanation aid for correctors, not a student defense-training page. Reframed the route as a reviewer guide, renamed the project chapter to Project walkthrough and practice questions to Further explanation, and added an audience introduction. Removed the unofficial checklist from the rendered documentation route; its repository file remains preserved for internal preparation. Navigation now says Documentation. Build and whitespace checks passed. Preserve this audience distinction in future edits.

## Reference-style blockchain demonstration — 2026-10-16

User requested closely mimicking Anders Brownworth’s Hash, Block and Blockchain demos inside reviewer documentation. Inspected the live pages, stylesheet and MIT-licensed source. Replaced the simplified frozen-parent three-block lab with three tabs: live SHA-256, single block with editable block number/nonce/data and Mine, and five horizontal blocks with dynamic previous-hash propagation. Uses reference field concatenation, initial nonces and four-zero target; initial hashes match the reference. Scoped Bootstrap-style black navigation, grey hash fields, blue Mine buttons and green/red panels recreate its presentation inside the existing app. Mining runs in a cancellable worker; reset, keyboard tabs and explanatory status are included. Hash fields are selectable read-only fields. Attribution and original MIT license are preserved and displayed. No wallet or blockchain transactions occur; proof of work is explicitly distinguished from Ethereum proof of stake.

Validation: npm test includes new code/tests/blockchain-demo.mjs for SHA-256 vectors, reference fixtures, downstream propagation and actual mining worker/sequential chain repair. Production build passed. DOM/worker interaction rehearsal covers tabs, typing, validity panels, mining, reset and cancellation; real-browser pixel-level review remains pending. Existing contract code and deployment records are unchanged.

## NFT documentation chapter — 2026-10-17

Added a reviewer-facing NFTs & minting chapter after ERC-20, bringing documentation to eleven chapters. Explains NFT identity, minting versus transfer, unminted items, transaction execution/receipts, wallet/explorer indexing, metadata/images, subsequent ownership, approvals and contract-dependent burn behavior. Includes a lifecycle illustration and ERC-20/ERC-721 comparison, with primary-source references. Educational only: no NFT contract, mint UI, deployment or changes to fixed-supply Club42. Production client build and whitespace checks passed.

## Explorer alternatives for correction tests — 2026-10-17

Added yellow Etherscan instruction panels below initial-state checks and every mandatory token operation: transfer, approval, delegated spending, revocation and expected rejection. Each supplies signing account, exact base-unit arguments, expected events/state and direct links to the session contract’s specific read/write function via #readContract#F<n> / #writeContract#F<n>. Checked Etherscan’s live address-page anchor parser and Club42 read/write ABI ordering. The current explorer offers Simulate (eth_call), used for the no-gas rejection check with an explicit fallback if unavailable. Instructions distinguish external writes from app-logged transactions and prevent duplicating each step in both interfaces. No contract changes. Production build and whitespace checks passed.

## Consolidated correction explorer guide — 2026-10-17

User requested removing repeated yellow guides because they cluttered the UI. Replaced them with one compact yellow panel in Prepare explaining app versus explorer, with an expandable centralized explorer sequence, session-specific function links and exact base-unit inputs. Links appear after deployment. No yellow panels remain in Initial state or Token tests. Production client build and whitespace checks passed.

## Save and push — 2026-10-17

User requested committing and pushing the latest client/documentation work to the existing private GitHub origin/main. Final npm test passed token, treasury and blockchain-demo suites; npm run client:build and git diff --check passed. Included reviewer documentation (eleven chapters including educational NFTs), reference-style hash/mining demos, session-specific correction flow, one centralized explorer guide in Prepare, scrollbar styling and supporting docs/tests/license. Contracts and original deployment records are unchanged. Generated artifacts, local runtime and dependencies remain ignored.

Next: finish a fresh real-MetaMask/Sepolia correction rehearsal and browser layout review, record its evidence separately, and prepare the separate school submission only upon request. NFTs remain explanatory only. No new public deployment or school submission was performed by this save.
