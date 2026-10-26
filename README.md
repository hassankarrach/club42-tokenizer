# Club42 — Tokenizer

Club42 represents internal club credits: **42,000 CLUB42**, 18 decimals, created for the deployer once. There is no later minting or privileged administrator.

Ethereum's ERC-20 standard provides wallet compatibility. Solidity with OpenZeppelin 5.4.0 provides a standard implementation. Sepolia allows public testing without real funds. The bonus treasury requires two of three organizers to approve distributions of existing tokens.

## Run

Requires Node.js 22 (22.12 or newer).

```sh
npm ci
npm run client:dev
```

Open http://127.0.0.1:5173/; use MetaMask on Sepolia. `npm run compile` builds contracts; `npm run client:build` builds the optional React client.

## Public contracts

Network: **Sepolia** (11155111). Both contracts are source-verified on Etherscan.

- Token: [0x200c145609fDC02067f8b629368BA397153B9598](https://sepolia.etherscan.io/address/0x200c145609fDC02067f8b629368BA397153B9598#code)
- Multisig treasury: [0xd433D14b92c44A608607590eb323BEd9F368D6F4](https://sepolia.etherscan.io/address/0xd433D14b92c44A608607590eb323BEd9F368D6F4#code)

## Repository

- [code/](code/): token and bonus treasury contracts.
- [deployment/](deployment/README.md): Remix deployment instructions and public deployment records.
- [documentation/](documentation/): purpose, security, usage and Remix evaluation guide.
- [client/](client/README.md): optional wallet interface and reviewer documentation.

For evaluation, follow the [Remix deployment instructions](deployment/README.md) and [manual demonstration](documentation/remix-correction.md). `scripts/compile.cjs` generates the artifacts needed by the optional UI.
