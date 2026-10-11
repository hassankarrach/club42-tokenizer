# Club42 continuation plan

Updated 2026-10-11. Read this file before continuing on the school machine.

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
- `client/`: README only; no React app.
- `deployment/`: compiler and README only; no public deployment script.
- Public testnet has not been selected. No public contract address or explorer verification exists.
- Local behavioral tests passed again before the handoff on 2026-10-11. Mandatory submission is NOT finished.

## Resume on the school machine

1. Clone this private repository using the user's own GitHub authentication. Do not copy credentials from another machine.
2. Start with Node.js 22 LTS; original tests passed on Node 22.9.0. Record the school machine's version.
3. Run `npm ci`, then `npm test`. `npm run compile` compiles separately.
4. Tests require no MetaMask, public RPC, private key, or real funds. They deploy on a disposable in-memory chain.
5. Native acceleration warnings may fall back to JavaScript; confirm exit code and assertions. Investigate actual failures rather than suppressing them.
6. Keep dependencies, generated artifacts, and secrets out of Git.
7. The lockfile marks Ganache's bundled macOS-only fsevents package optional. A Linux-targeted npm ci dry run passed on the Mac; actual Linux execution still needs to be checked on the school machine.

## Next work, in order

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

This repository contains a requirements summary, not the original subject PDF. Recheck the current school subject and evaluation sheet. npm reported audit findings in development dependencies; review before using beyond the local harness. Passing tests is not an audit or guaranteed evaluation acceptance.

GitHub is a private working/transfer copy. Submitting to the school's repository is a separate user-authorized step; preserve GitHub origin and add a separate school remote when requested.

## Suggested prompt for the next Codex agent

Read AGENTS.md and PLAN.md, inspect Club42, and run npm ci and npm test. Explain one concept at a time and check my understanding. Then help complete public testnet deployment and documentation, followed by the optional React client and multisig bonus.
