# Multisig treasury (bonus)

`code/Club42Treasury.sol` holds existing CLUB42 tokens. It does not change the token contract or create more tokens. Deployed and source-verified on Sepolia, funded with 1,000 CLUB42. Local tests pass. React controls are implemented; public proposal/approval/execution demonstration succeeded.

## Rules

- Constructor takes the existing token contract address and three distinct, non-zero organizer addresses. The token address must contain code; deployment must still use the correct CLUB42 address.
- Any holder can deposit through the token's normal `transfer(treasuryAddress, amount)`.
- Only organizers can propose, approve, or execute outgoing distributions.
- A proposal fixes a non-zero recipient and positive amount. Sending to the treasury itself is rejected.
- Proposing grants no approval. Two distinct organizers approve separately through signed transactions.
- An organizer executes the approved proposal once. The contract marks it executed before calling the token, preventing repeat execution of that proposal.
- A failed token transfer reverts the execution mark too. Organizers can retry after funding the treasury.

`proposalCount`, `proposals`, `approved`, and `isOrganizer` expose public reads. `Proposed`, `Approved`, and `Executed` events let clients discover activity. Events do not automatically notify wallets.

## Limits

Signers and the two-of-three threshold are fixed. There is no signer replacement, proposal cancellation, approval revocation, or expiry. Losing two signer keys can lock funds. Two compromised signers can spend the reserve. Approved proposals do not reserve funds, so execution can fail if earlier proposals spend the balance. This treasury only distributes its configured token; do not send other assets.

Three accounts controlled by one student demonstrate mechanics, not independent governance. In real use, different people should hold the keys. Local tests are not a security audit.

## Tests

`npm test` runs both token and treasury suites. Treasury checks cover configuration, deposits, unauthorized actions, invalid proposals, separate/duplicate approvals, insufficient approvals, correct movement, replay prevention, and rollback/retry after an actual mined failure.

## React treasury controls

Open the Treasury tab with MetaMask on Sepolia. It shows the treasury balance, your organizer status, and proposals (ten per page, newest first). Reads refresh every 15 seconds and after writes; Refresh updates immediately. Each proposal shows recipient, amount, approval count, whether you approved, and execution status.

An organizer enters recipient/amount to propose, then approves separately. Switch to a second organizer to approve again. Execute becomes available after two approvals. Executed proposals cannot be approved/executed again. Non-organizers can read but cannot use write controls. Contract checks still enforce all permissions independently of the UI.

Every action simulates before asking MetaMask to sign. Activity/error messages and transaction links appear at the panel bottom. No automatic notifications are sent to closed wallets.

Public demonstration: proposal #0 sent 100 CLUB42 to Member after approvals from the original account and Organizer 3. [Execution transaction](https://sepolia.etherscan.io/tx/0xadf30fa7e1bef0bb8ee4575e31901d47319c16e8df8e4fdfe6ff6ba60a6a35bb) succeeded; verified balances were treasury 900 and member 210, with total supply 42,000. A read-only repeat-execution attempt reverted with AlreadyExecuted.
