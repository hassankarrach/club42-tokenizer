# Deployment and verification

The current token is already deployed and verified on **Sepolia**. See [sepolia.json](sepolia.json) for the address, deployer, transaction, and explorer link. Use that contract for interactions.

The deployment UI is integrated into the React client at `/deploy`. This folder holds compilation, verification, configuration, and deployment records.

## Reproduce deployment

After the [root setup](../README.md#run), run:

```sh
npm run client:dev
```

Open http://127.0.0.1:5173/deploy in Brave:

1. Select the intended MetaMask account on Sepolia, funded with free test ETH.
2. Connect MetaMask using the header, select **Club42 token**, click **Estimate deployment fee**, and check the account and fee.
3. Click **Deploy with MetaMask**, review the final details, and sign yourself.
4. Wait for confirmation and initial supply/balance checks. Save the contract address and transaction hash; update `sepolia.json` only when intentionally replacing the recorded deployment.
5. Stop the server with Ctrl+C.

Each deployment creates a new contract with 42,000 CLUB42 assigned to its deployer. Keys stay in MetaMask. The existing client contract records are not changed automatically. If follow-up checks fail after submission, inspect the explorer before retrying. Reloading or leaving the deployment view resets its duplicate-deployment protection.

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

## Deploy the bonus treasury

Run `npm run client:dev`, then open **http://127.0.0.1:5173/deploy**. Select **Multisig treasury** for the bonus. Connect the intended signing account on Sepolia, estimate the deployment fee, and review the token, all three organizers, threshold, and fee before deploying. Configuration is in `treasury-config.json`; signers cannot be changed after deployment. No tokens are moved automatically.

After confirmation, save the address and transaction hash. Generate the explorer files:

```sh
npm run verification:input -- Club42Treasury
```

Use the same compiler/license as the token. Upload `artifacts/Club42Treasury.standard-input.json`, select `Club42Treasury.sol:Club42Treasury` if asked, and paste `artifacts/Club42Treasury.constructor-args.txt` if constructor arguments are requested. Arguments must match the configuration actually deployed. Record treasury address only after confirmed deployment. Source verification and reserve funding are separate steps.
