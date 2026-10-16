# React client

After the [root setup](../README.md#run), run `npm run client:dev` and open http://127.0.0.1:5173 in Brave. Connect MetaMask on Sepolia. `npm run client:build` generates ignored `client/dist/` output.

The Token view uses the existing contract in `deployment/sepolia.json`; no redeployment is needed. It prefers MetaMask through EIP-6963 when Brave Wallet is also installed. Keys stay in MetaMask.

See [usage and demonstration](../documentation/usage.md) for operations. If changing accounts in MetaMask does not update the page, click **Switch account** and authorize the intended account for this site.

Production build, public reads, account selection, transfers, approvals, delegated spending, revocation, and decoded rejection were exercised. Wrong-network and cancellation flows still need manual review. Hosting is not configured.

**Treasury** shows the existing two-of-three reserve and proposals, with organizer-only propose/approve/execute controls. See [multisig usage](../documentation/multisig.md#react-treasury-controls).

## Deployment

Open http://127.0.0.1:5173/deploy or use **Deploy** in the header. The same wallet connection supports token and treasury deployment, fee estimation, signing, and confirmation checks. Dev/build commands compile both contracts first. Generated ABI/bytecode are included in the client build; keys stay in MetaMask. New deployments do not replace the recorded contracts used by the Token view. See [deployment instructions](../deployment/README.md).

The standalone deployment server has been removed. Production hosting must serve the client entry point for `/deploy` as well as `/`.
