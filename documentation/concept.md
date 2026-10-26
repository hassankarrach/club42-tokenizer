# Concept and security

Club42 represents internal club credits held by member wallets. It implements ERC-20 on Sepolia. The blockchain lets members independently verify supply, balances, and transactions; a centralized database would be simpler if that independence were unnecessary.

## Supply and permissions

The constructor creates **42,000 CLUB42** for the deployer. Tokens use 18 decimals: one CLUB42 is `10^18` integer units. Transfers change balances, not total supply.

There is no privileged owner role, later minting, public burning, freezing, or seizure. The deployer controls its initial reserve like any holder controls its balance. The bonus [multisig treasury](multisig.md) provides shared control of tokens deposited into it.

| Function | Purpose |
| --- | --- |
| `name`, `symbol`, `decimals` | Read token metadata |
| `totalSupply`, `INITIAL_SUPPLY` | Read current and initial supply |
| `balanceOf(account)` | Read a holder's balance |
| `transfer(to, amount)` | Send the caller's tokens |
| `approve(spender, amount)` | Set permission to spend the caller's tokens |
| `allowance(owner, spender)` | Read remaining permission |
| `transferFrom(from, to, amount)` | Spend tokens using the caller's allowance |

The constructor is student code; standard token operations come from OpenZeppelin. Successful movements emit `Transfer` events; approvals emit `Approval` events.

## Security limits

- Whoever controls a wallet's key controls its tokens. The contract cannot recover lost keys or reverse completed transfers.
- Approval moves no tokens, but lets the spender choose the recipient. Approve only trusted addresses. To change a non-zero allowance, revoke it and wait before granting another; a spender may still spend before revocation confirms.
- The contract rejects insufficient balances, insufficient allowances, and zero-address transfers. The React interface does not enforce the blockchain's rules; the contract does.
- SepoliaETH pays gas; CLUB42 does not. Reads need no wallet signature. Submitted transactions can cost gas even when they revert.
- Tokens implement no voting, redemption, legal ownership, or value guarantee. Tests and explorer verification are not a security audit.
