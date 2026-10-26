# Correction with Remix

Follow the [Remix deployment instructions](../deployment/README.md) to compile, deploy and verify the contracts. Practice with Remix VM first, then use Sepolia for public deployment evidence.

## Mandatory token demonstration

Use two distinct accounts: owner (deployer) and member. Switch the signing account in MetaMask for public transactions and confirm Remix displays it. On a fresh token with no other activity:

| Step | Signing account | Function and inputs | Expected result |
| --- | --- | --- | --- |
| Initial reads | Any | `name`, `symbol`, `decimals`, `totalSupply`, `balanceOf(owner)` | Club42, CLUB42, 18; supply and owner balance 42,000 tokens |
| Transfer | Owner | `transfer(member, 100000000000000000000)` | Owner 41,900; member 100; Transfer event |
| Approval | Owner | `approve(member, 25000000000000000000)` | Allowance 25; balances unchanged; Approval event |
| Delegated spending | Member | `transferFrom(owner, member, 10000000000000000000)` | Owner 41,890; member 110; allowance 15; Transfer event |
| Revoke | Owner | `approve(member, 0)` | Allowance zero; Approval event |
| Rejected spending | Member | `transferFrom(owner, member, 1000000000000000000)` | `ERC20InsufficientAllowance`; no token movement |

Amounts passed to contracts are integer base units (18 decimals), not display amounts. Check balances, `allowance(owner, member)` and unchanged total supply after operations. Remix VM is suitable for trying rejected transactions without public gas. On Sepolia, inspect the estimation/simulation error and cancel rather than force-send a known failure. Keep successful transaction hashes and explorer links separately; there is no client session export.

Explain that the token has no privileged owner, later minting, seizure or freezing. The deployer initially holds the supply, but has no special transfer powers over other holders.

## Optional two-of-three treasury

1. Compile and select Club42Treasury. Its constructor takes the **new token address** and an array of three distinct non-zero organizer addresses, for example `["0x…", "0x…", "0x…"]`. Signers and threshold cannot be changed later.
2. Deploy, record the address/hash and verify its source with the actual constructor arguments. Check `token`, `organizers`, `REQUIRED_APPROVALS` (2) and `proposalCount` (0).
3. As the token holder, call the token's `transfer(treasury, 1000000000000000000000)` to deposit 1,000 CLUB42.
4. As organizer A, call treasury `propose(member, 100000000000000000000)`. On a fresh treasury this is proposal 0. Proposing grants no approval.
5. Call `approve(0)` as A. Execution with one approval must reject with `InsufficientApprovals`; practice rejection in Remix VM or inspect Sepolia estimation without force-sending.
6. Switch to organizer B, call `approve(0)`, then `execute(0)`. Check two approvals, executed=true, Transfer/Executed events, treasury balance 900 and recipient balance increased by 100.
7. Check replay rejection (`AlreadyExecuted`), duplicate approval rejection on a pending proposal (`AlreadyApproved`), and non-organizer write rejection (`NotOrganizer`). Use the local sandbox for deliberate failed transactions.

The treasury distributes existing tokens; ordinary holder transfers do not require multisig approval. See [multisig rules and limits](multisig.md). Three student-controlled accounts demonstrate the mechanism, not independently controlled governance. Public verification, real-wallet rehearsal and code explanations remain manual evaluation steps.
