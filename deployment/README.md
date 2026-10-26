# Deploy with Remix

The subject permits Remix and requires a separate folder for deployment materials. This folder contains these instructions and the existing Sepolia records:

- [sepolia.json](sepolia.json): token address, network, transaction and explorer link.
- [treasury-sepolia.json](treasury-sepolia.json): bonus treasury record, including its token and three organizer constructor arguments.

The recorded contracts are already deployed and verified. You can use their addresses without deploying again. The client reads these records; a fresh Remix deployment does not update them automatically.

## Token deployment

1. Open [Remix](https://remix.ethereum.org/), create a workspace and upload `code/Club42.sol`.
2. In the Remix copy, replace `@openzeppelin/contracts/` imports with `@openzeppelin/contracts@5.4.0/`. Keep the repository source unchanged.
3. Select Solidity **0.8.30**, enable the optimizer with **200 runs**, set the EVM target to **Paris**, and compile.
4. Open **Deploy & Run**, select **Club42**, and leave Value at **0**. Practice with **Remix VM** first. For public deployment, use **Browser Extension** (or **Injected Provider**) with MetaMask on **Sepolia**, chain ID **11155111**, funded with free test ETH.
5. Deploy with no constructor arguments and review the wallet transaction before signing. Each deployment creates a new token with **42,000 CLUB42** assigned to its deployer.
6. Save the contract address, deployer, transaction hash, network and explorer link. If intentionally replacing the recorded token, update `sepolia.json`; the existing treasury still refers to its original token.
7. Verify the source on Sepolia Etherscan using the sources and compiler settings from this Remix build, for example through Remix's Contract Verification plugin. Select the **MIT** license and confirm **Exact Match** before recording verification success. Keep service credentials out of Git.

Remix VM is a local sandbox; it does not satisfy the public deployment requirement. Use test funds only.

## Optional bonus treasury

Upload `code/Club42Treasury.sol` and compile with the same settings. Select **Club42Treasury**, then supply the token address and an array of three distinct non-zero organizer addresses. These constructor arguments must match the treasury you intend to demonstrate; the threshold is fixed at two approvals.

Deploy, verify with the actual constructor arguments, and save the details in `treasury-sepolia.json` if replacing the recorded treasury. Deployment does not fund it: transfer tokens to its address separately.

For the evaluation walkthrough, follow the [token and multisig demonstrations](../documentation/remix-correction.md#mandatory-token-demonstration).

The optional client's compilation helper is `scripts/compile.cjs`; it is not needed for the Remix workflow.
