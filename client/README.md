# React client

After the [root setup](../README.md#run), run `npm run client:dev` and open http://127.0.0.1:5173 in Brave. Connect MetaMask on Sepolia. `npm run client:build` generates ignored `client/dist/` output.

The client uses the existing contract in `deployment/sepolia.json`; no redeployment is needed. It prefers MetaMask through EIP-6963 when Brave Wallet is also installed. Keys stay in MetaMask.

See [usage and demonstration](../documentation/usage.md) for operations. If changing accounts in MetaMask does not update the page, click **Switch account** and authorize the intended account for this site.

Production build, public reads, account selection, transfers, approvals, delegated spending, revocation, and decoded rejection were exercised. Wrong-network and cancellation flows still need manual review. Hosting is not configured.
