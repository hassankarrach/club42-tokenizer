# Deployment and verification

The current token is already deployed and verified on **Sepolia**. See [sepolia.json](sepolia.json) for the address, deployer, transaction, and explorer link. Use that contract for interactions.

## Reproduce deployment

After the [root setup](../README.md#run), run:

```sh
npm run deploy:local
```

Open http://127.0.0.1:4243 in Brave:

1. Select the intended MetaMask account on Sepolia, funded with free test ETH.
2. Click **Connect & estimate** and check the account and fee.
3. Click **Deploy with MetaMask**, review the final details, and sign yourself.
4. Wait for confirmation and initial supply/balance checks. Save the contract address and transaction hash; update `sepolia.json` only when intentionally replacing the recorded deployment.
5. Stop the server with Ctrl+C.

Each deployment creates a new contract with 42,000 CLUB42 assigned to its deployer. The localhost-only server handles no keys. If follow-up checks fail after submission, inspect the explorer before retrying. Reloading resets the page's duplicate-deployment protection.

## Explorer source verification

```sh
npm run verification:input
```

This embeds Club42 and its imports in ignored `artifacts/Club42.standard-input.json`, then confirms self-contained compilation matches the existing artifact.

On the contract's Sepolia Etherscan page, choose **Verify and Publish**:

- Type: **Solidity (Standard-Json-Input)**
- Compiler: **v0.8.30+commit.73712a01**
- License: **MIT**
- Upload: `artifacts/Club42.standard-input.json`
- Constructor arguments: empty; contract: `Club42.sol:Club42` if asked

The JSON specifies optimizer enabled, 200 runs, Paris EVM. Etherscan compares compilation with deployed code; verification needs no gas and is not a security audit. Confirm **Exact Match** before recording verification success.
