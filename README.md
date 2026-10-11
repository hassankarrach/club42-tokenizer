# Club42 — Tokenizer

Club42 represents internal club credits controlled by member wallets.

Status: base contract implemented and local behavioral tests pass; public deployment, React client, and multisig remain pending.

## Choices

- Name: Club42 (includes 42)
- Symbol: CLUB42
- Standard: ERC-20, implemented with OpenZeppelin Contracts 5.4.0
- Fixed supply: 42,000 tokens with 18 decimals, assigned to deployer at creation
- No later minting or privileged administrator functions
- Solidity 0.8.30 compiler; optimizer enabled, 200 runs; Paris EVM target
- Public test network: to be selected

Fixed supply keeps the token simple and prevents later dilution. Standard ERC-20 behavior supports wallet interoperability. The deployer controls the initial reserve; shared control requires the separate multisig bonus.

## Layout

- `code/`: contract source and behavioral tests
- `deployment/`: compiler and future deployment materials
- `documentation/`: concept, permissions, and future usage guide
- `client/`: optional React dApp, not yet implemented

## Compile

```sh
npm ci
npm run compile
npm test
```

## Deployment record

Not deployed. Add network, contract address, and explorer URL after public testnet deployment.

## Next steps

Testnet deployment and explorer publication, usage documentation, optional React client, then optional multisig.

## Continue on another machine

Read [PLAN.md](PLAN.md) for setup, current status, and the completion plan. [AGENTS.md](AGENTS.md) records guidance for the next Codex session.

Use Node.js 22 LTS initially. Clone this private repository, run `npm ci`, then `npm test`. No wallet or public RPC is needed for local tests.
