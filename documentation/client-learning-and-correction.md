# Documentation and correction routes

Run `npm run client:dev` using Node 22, then open the client locally. Nothing in these routes requires real funds. Keys and signing stay in MetaMask.

## Reviewer documentation: `/documentation`

Eleven chapters cover ledgers, hash links, consensus/finality, wallets/testnets, transactions/gas, deployment/verification, ERC-20/fixed supply, NFTs/minting, allowances, treasury/security and project defense. This route helps the author explain the project to correctors. Each chapter includes a concrete example and an expandable clarification. The project chapter displays the actual contract sources and saved subject. The unofficial correction checklist stays in the repository as internal preparation material and is not displayed in this route.

The Blocks & hashes chapter includes three demo tabs closely recreating [Anders Brownworth's Hash, Block and Blockchain demos](https://andersbrownworth.com/blockchain/): a SHA-256 data field, a single editable block with nonce/mining, and five horizontally scrolling linked blocks. The field layout, grey read-only hashes, blue Mine buttons and green/red proof-of-work panels follow the reference. The reference's field concatenation and initial nonces are reproduced, so the initial hashes match it.

Changing an earlier block automatically propagates its hash through all later blocks, usually invalidating their work. Mine finds a nonce for a hash starting with four zeroes; re-mine affected blocks in order. Mining runs in a Web Worker so the app remains responsive, and can be cancelled. Reset restores the original demo. Hash fields are read-only rather than disabled so reviewers can select/copy them; tabs support keyboard navigation and status text explains the colors. This simplified SHA-256/proof-of-work model does not represent Ethereum's block encoding or proof-of-stake consensus. No wallet, fees or network transactions are involved. Gas and finite-allowance labs are also browser-only illustrations.

The adapted demonstration includes attribution and the original MIT license, displayed in the demo and preserved in [third-party/anders-blockchain-demo-LICENSE.txt](third-party/anders-blockchain-demo-LICENSE.txt). Reference source: [anders94/blockchain-demo](https://github.com/anders94/blockchain-demo).

Sources are linked within the route: Ethereum developer documentation, ERC-20 specification and OpenZeppelin ERC20 documentation. Project-specific explanations follow the actual contracts.

## Correction: `/correction`

Seven selectable phases guide preparation, token deployment, explorer/source verification, initial-state inspection, token operations, optional multisig and evidence export. Phases remain selectable so an evaluator can choose the demonstration order. This is a preparation aid, not a verified official scale or an automatic grading system.

The original `/` dashboard still uses `deployment/sepolia.json` and `deployment/treasury-sepolia.json`. Correction operations exclusively target the token and treasury saved in the active correction session. Fresh deployments do not overwrite repository deployment records.

### Mandatory demonstration

1. Connect the owner account on Sepolia. In Prepare, enter a different member address. Both need test ETH if they will submit transactions.
2. Deploy the token in the session. Review the fee, account and network in MetaMask. The client records the address and hash upon submission, then checks confirmation and initial supply/deployer balance. Each new instance has its own 42,000 CLUB42.
3. Use the session explorer links. Run `npm run verification:input`, upload the generated Standard JSON, and verify this instance with the matching compiler/settings. Verification and explorer checks are marked manually, not inferred from deployment success. The compiler is 0.8.30, optimizer enabled with 200 runs, Paris EVM, MIT license, with no token constructor arguments.
4. Read initial metadata, supply, balances and allowance before changing state. A matching name/symbol/supply does not prove identical code; inspect and verify the source independently.
5. On a fresh token, send 100 from owner to member; approve the member for 25; switch to member and spend 10 from owner to member; switch to owner and revoke to zero; switch to member and simulate another spend of 1. Require the exact `ERC20InsufficientAllowance` error. This last check submits no failing transaction.
6. Compare final owner/member balances of 41,890/110, allowance zero and total supply 42,000, assuming no other activity. Confirm each transaction in the explorer. The client records receipt events, before/after state at block numbers and explicit comparison results. Concurrent transactions can cause state comparisons to differ even when the demonstrated transaction succeeded.

Explorer Read Contract and Write Contract are independent options once source is verified. Amounts in the explorer are integer base units; the client accepts whole-token amounts. 100 CLUB42 is `100000000000000000000` base units. External transaction hashes/results can be saved in session notes.

### Optional multisig

Choose three distinct, non-zero organizer addresses before estimating. Changing configuration invalidates an existing estimate. The session treasury deployment uses the session token, not the original token. Organizers cannot be changed after deployment.

Fund with 1,000 session CLUB42, propose 100 to the member, approve with organizer A, simulate execution with one approval and require `InsufficientApprovals`, approve with organizer B, then execute. Simulate replay and require `AlreadyExecuted`. The UI includes both rejection checks and uses no gas for simulations. Funding and successful transfers are repeatable; inspect receipts and balances before repeating them.

Verify treasury source separately with `npm run verification:input -- Club42Treasury`. The script's generated constructor-arguments file reflects the original repository config, so **use the session-specific encoded arguments displayed in the correction route** for this fresh treasury. The token/organizer values must match deployment.

### Persistence and recovery

The active session is stored in this browser's localStorage under `club42.correction.v1`. It includes public addresses, transaction hashes, state observations, manual confirmations and notes. It contains no keys. Avoid entering secrets in notes. Storage does not transfer automatically to another school machine/browser, and clearing browser data removes it.

Export the JSON evidence before leaving. Starting another correction first exports the current session, then clears the active record and creates a new session. Keep each evaluation's export separately. The client currently supports one active session; exported records are for review and are not imported back into the UI. Storage failures display a warning to export before leaving.

Submitted deployment records block duplicate deployment within that session, including after navigation/reload. Recheck saved receipts after a reload; a successful receipt and matching metadata allow continuation. Direct contract-creation deployments can also be recovered from their transaction hash when no token is recorded. Routed/smart-wallet receipts may require inspecting the saved address and explorer evidence rather than direct receipt recovery. Confirmed operation records and unresolved submitted records remain distinct; inspect unresolved hashes before retrying.

### Validation and limits

The production build and both existing contract suites passed. A disposable jsdom/Ganache integration rehearsal used a simulated wallet and local chain with Sepolia's chain ID: documentation labs, token deployment, transfer, approval, delegated spending, revocation and rejection; fresh session treasury deployment/funding, two approvals, execution and replay rejection; session restoration after route navigation, simulated wrong-network write gating and rejected wallet signing. This was local testing, not a public Sepolia demonstration or visual browser review.

Real MetaMask signing/cancellation, account/network changes, explorer source publication, mobile layout and a complete new public session still require manual rehearsal. Existing public deployments and historical demonstrations remain recorded separately. School submission and hosting have not been performed by this change.

Demo validation: `npm test` now also runs `code/tests/blockchain-demo.mjs`, checking standard SHA-256 vectors, reference starting hashes, downstream propagation and actual mining-worker execution with sequential chain repair. A disposable DOM/worker rehearsal checks tab interactions, typing, colors, mining, reset and cancellation. Production build passes; pixel-level visual comparison in a real browser remains pending.

The NFTs & minting chapter is explanatory only: it covers token identity, mint execution and confirmation, metadata display/indexing, later transfers/approvals and an ERC-20 comparison. No NFT contract or live minting feature is added.

### Demonstration choice in Prepare

A single yellow panel in Prepare explains the choice between the app and Sepolia Etherscan. An expandable guide contains initial-state checks, direct function links and exact base-unit arguments for all five mandatory token operations. Links become available after the session token is deployed; return to Prepare to use them. Later phases have no repeated yellow panels.

Choose one interface per transaction to avoid repeating it. Source/ABI recognition is needed for explorer forms. Save external transaction hashes in session notes. The final rejection uses Simulate, with the app or another eth_call tool as a fallback if unavailable. Function links follow the Club42 order checked on 2026-10-17; select the function by name if Etherscan changes it.
