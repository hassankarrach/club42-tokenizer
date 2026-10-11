# Local testing

Run `npm test` from the project root. The command compiles Club42, launches an in-memory Ganache chain, deploys with ethers, checks operations, and disconnects the chain. The accounts and funds are disposable. No public network, wallet extension, or real funds are used.

Checks: metadata and initial supply; deployer balance; transfer balances and unchanged supply; rejected overspending and zero-address recipients; spending without approval; allowance creation; delegated spending and allowance reduction; rejected allowance overspending; approval revocation; no public mint function.

Rejection checks simulate calls and assert the expected contract error. Successful operations submit transactions and wait for receipts.

Ganache and solc are development-only tooling. The installation reports dependency audit findings; this local harness should not be exposed as a hosted service. The contract itself imports only OpenZeppelin ERC20.
