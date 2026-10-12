# Use Club42

Start the [React client](../client/README.md), connect MetaMask, and select Sepolia. Transaction signers need free SepoliaETH for gas; recipients need none just to receive tokens.

A **wallet address** identifies a holder, the **contract address** identifies Club42, and a **transaction hash** identifies one submitted action.

## Client actions

Enter readable token amounts such as `10` or `0.5`; the client handles decimals.

- **Send:** enter recipient and amount; sends your own tokens.
- **Approve:** enter spender and amount; sets permission without moving tokens. Enter `0` to revoke.
- **Spend allowance:** connect the spender; enter token owner, recipient, and amount.
- **Check current allowance:** reads permission without gas.

Review the account, network, and fee in MetaMask before signing. Wallet Activity shows pending/confirmed status, red error messages, and an explorer link for submitted transactions. Simulated rejections stop before signing and spend no gas. If a submitted transaction's confirmation fails, check its explorer link before retrying.

Use **Switch account** to authorize/select another account. **Refresh balance** updates reads after external activity. A wrong-network warning offers a Sepolia switch.

## Short demonstration

Starting with owner A holding 42,000 tokens and member B holding none:

| Action                      | A balance | B balance | B allowance from A |
| ---                         | ---:      | ---:      | ---:               |
| A sends B 100               | 41,900    | 100       | 0                  |
| A approves B for 25         | 41,900    | 100       | 25                 |
| B spends 10 from A to B     | 41,890    | 110       | 15                 |
| A approves B for 0          | 41,890    | 110       | 0                  |
| B attempts another 1 from A | Rejected; balances and allowance unchanged |

Total supply stays 42,000. This sequence was demonstrated through the public client; the user confirmed final balances and the decoded insufficient-allowance rejection. These are recorded observations, not guaranteed current balances. Repeat with smaller amounts if the starting balances differ.

The member also needs SepoliaETH before signing delegated spending. The initial 25-token [approval transaction](https://sepolia.etherscan.io/tx/0x6e3de4150f4f5b755c884df0746f283b6a2e7d1edf2d62b5b9985a7a0ddfd527) was independently checked on Etherscan; other demonstration transaction hashes were not recorded.
