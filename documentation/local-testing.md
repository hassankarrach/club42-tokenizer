# Local testing

With Node 22 and dependencies installed, run `npm test` from the repository root.

The command compiles Club42, starts a temporary in-memory Ganache chain with three funded test accounts, executes the bytecode, and checks results using ethers and Node assertions. No peers, MetaMask, public RPC, or real funds are needed. The chain is discarded afterward.

Checks cover metadata, initial supply/balance, transfers, unchanged supply, rejected overspending and zero-address transfers, approvals, delegated spending, allowance limits, and revocation. Rejections use simulations and check the expected custom error; successful writes wait for transaction receipts. The ABI is also checked for absence of a function named `mint` (not a general proof against hidden minting).

School Linux tests passed with Node 22.23.3. Ganache's native acceleration warning is acceptable when its JavaScript fallback completes all assertions. Node 12 is too old. Development dependencies have reported audit findings; keep the local harness private. These tests validate contract behavior, not distributed consensus or security against every attack.
