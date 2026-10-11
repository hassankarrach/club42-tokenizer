# Club42

Club42 is a demonstration of wallet-controlled club credits. Five fictional members can hold and transfer CLUB42 credits, with a shared reserve intended for the future multisig bonus.

## Why blockchain?

Members can independently verify supply, balances, and transactions and control their holdings with their own wallets. Shared reserve approval is a separate multisig feature, not provided by the base ERC-20 contract. A trusted central administrator and database would be simpler if shared control were unnecessary.

## Base contract

- Name: Club42
- Symbol: CLUB42
- Standard: ERC-20
- Decimals: 18
- Supply: 42,000 tokens, created only during deployment
- Initial holder: deployer
- No post-deployment mint function, account freezing, seizure, or privileged owner role
- Transfers and standard allowance-based spending provided by OpenZeppelin ERC20

The deployer initially controls the reserve. Until the reserve is moved to an implemented multisig contract, it is not collectively controlled. Tokens confer no implemented voting, legal ownership, redemption, or monetary-value guarantees.

## Planned demonstration

Deploy on a public testnet, distribute credits to member wallets, transfer between members, demonstrate approved spending, and show rejected overspending. For the bonus, place reserve tokens in a multisig treasury and demonstrate threshold approvals before a distribution.
