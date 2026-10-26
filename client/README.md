# React client

After the [root setup](../README.md#run), run `npm run client:dev` and open http://127.0.0.1:5173 in Brave. Connect MetaMask on Sepolia. `npm run client:build` generates ignored `client/dist/` output.

The Token view uses the existing contract in `deployment/sepolia.json`; no redeployment is needed. It prefers MetaMask through EIP-6963 when Brave Wallet is also installed. Keys stay in MetaMask.

Use Send for your own tokens, Approve to grant or revoke an allowance, and Spend allowance from the authorized spender account. Amounts use readable token units such as `10` or `0.5`. Review the account, network and fee before signing; inspect submitted transactions on the explorer before retrying. See the [manual demonstration](../documentation/remix-correction.md) for expected behavior. If changing accounts in MetaMask does not update the page, click **Switch account** and authorize the intended account for this site.

Production build, public reads, account selection, transfers, approvals, delegated spending, revocation, and decoded rejection were exercised. Wrong-network and cancellation flows still need manual review. Hosting is not configured.

**Treasury** shows the existing two-of-three reserve and proposals, with organizer-only propose/approve/execute controls. See [multisig usage](../documentation/multisig.md#react-treasury-controls).

## Deployment

Open http://127.0.0.1:5173/deploy or use **Deploy** in the header. The same wallet connection supports token and treasury deployment, fee estimation, signing, and confirmation checks. Dev/build commands compile both contracts first. Generated ABI/bytecode are included in the client build; keys stay in MetaMask. New deployments do not replace the recorded contracts used by the Token view. The treasury defaults come from `deployment/treasury-sepolia.json`. For evaluation, follow the [Remix deployment instructions](../deployment/README.md).

The standalone deployment server has been removed. Production hosting must serve the client entry point for `/deploy` as well as `/`.

## Reviewer documentation

`/documentation` explains the project to correctors through eleven chapters, interactive hash/allowance/gas examples, expandable clarifications and actual contract/subject texts.

Live correction deployment and contract operations use [Remix](../documentation/remix-correction.md). The Correction page has been removed. Hosting must serve the client entry point for `/documentation`, `/deploy` and `/`.

Decorative background videos stream from Cloudinary; no video files are included. Without video access, the gradient and static artwork remain visible. Reduced-motion styling disables the videos.
