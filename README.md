# Club42 — Tokenizer

Club42 is a fixed-supply token representing internal club credits. Members hold and transfer credits using their wallets.

Deployed on **Sepolia** and source-verified on Etherscan (Exact Match). Local tests pass; public transfers, approvals, delegated spending, and revocation were demonstrated. React is implemented; the multisig bonus is not.

## Choices

- **Ethereum / ERC-20:** a standard interface supported by wallets and tools. Sepolia allows public testing without real funds.
- **Solidity + OpenZeppelin 5.4.0:** readable contract code with an established ERC-20 implementation.
- **42,000 CLUB42, 18 decimals:** all created for the deployer at deployment. Fixed supply prevents later dilution; there are no administrator privileges.
- **solc 0.8.30, optimizer 200 runs, Paris EVM:** reproducible compilation with a compatible EVM target.
- **ethers + Ganache:** contract interaction and disposable local tests. React provides a wallet interface.

## Run

Use Node.js 22 (tested on school Linux with 22.23.3; no sudo needed). In this checkout, activate the ignored local installation first:

```sh
export PATH="$PWD/.tools/node-v22.23.3-linux-x64/bin:$PATH"
```

From the repository root:

```sh
npm ci
npm test
npm run client:dev
```

Open http://127.0.0.1:5173 in Brave and connect MetaMask on Sepolia. Tests need no wallet or internet after dependency installation. `npm run compile` builds separately; `npm run client:build` builds the client.

## Public contract

- Network: **Sepolia**, chain ID **11155111**
- Contract: [`0x200c145609fDC02067f8b629368BA397153B9598`](https://sepolia.etherscan.io/address/0x200c145609fDC02067f8b629368BA397153B9598#code)
- [Deployment transaction](https://sepolia.etherscan.io/tx/0x5f2e5deecf70da9a1d0c9d97cdc267cdd9928c5403d8d911639e17c904812e5f), block 11888821
- Machine-readable record: [deployment/sepolia.json](deployment/sepolia.json)

## Files and guides

- `code/`: token and behavioral tests
- `deployment/`: [deployment and verification](deployment/README.md)
- `documentation/`: [concept, security, usage, and tests](documentation/README.md)
- `client/`: [React client instructions](client/README.md)

The [subject v1.1](documentation/subject-v1.1.txt) is preserved. See [PLAN.md](PLAN.md) for remaining review and bonus work. GitHub is the private working copy; school submission is separate. Never commit keys, recovery phrases, `.env` files, dependencies, or generated artifacts.

The client uses a viewport-height layout with internal scrolling and a black/lime wallet card.

Brand PNGs are in `client/public/`, cropped from the provided `client/logo-source.png`.

The client background loops `client/public/bg-h264.mp4` silently beneath a sage-to-lime gradient overlay; reduced-motion users see a static background.

Next: finish the defense review, implement/test/deploy the multisig bonus and its client flows, then complete final checks before separate school submission.
