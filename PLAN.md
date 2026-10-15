# Club42 continuation plan

Updated 2026-10-14. Read before continuing.

## User preferences and constraints

Explain one concept at a time and check understanding. The user wants to defend their code, with a mock correction covering fundamentals through tricky implementation/security questions. No verified correction sheet has been found; full provided subject v1.1 is in documentation/subject-v1.1.txt.

Preserve fixed supply. Source/tests belong in code/, deployment tools in deployment/, docs in documentation/, React in client/. Testnets only; user signs in MetaMask. Never commit secrets, .env, dependencies, .tools, or generated build artifacts. GitHub origin is a private working copy; school submission is separate and requires an explicit request.

## Implemented and demonstrated

- Club42.sol: OpenZeppelin ERC-20 5.4.0, symbol CLUB42, 18 decimals, 42,000 tokens created for the deployer. No later minting, public burn, privileged owner, seizure, freezing, voting, or redemption.
- Sepolia token: 0x200c145609fDC02067f8b629368BA397153B9598. Source verified Exact Match. Record: deployment/sepolia.json.
- User demonstrated transfer of 100, approval of 25, delegated spending of 10, revocation to zero, and insufficient-allowance rejection. Original/member balances were 41,890/110 before treasury funding; these are historical observations.
- Club42Treasury.sol: immutable token, three fixed distinct organizers, two distinct approvals required. Organizer-only proposal/approval/execution. Proposing grants no approval. Recipient/amount fixed; duplicate approvals and execution replay rejected. SafeERC20 transfer; failure rolls back execution flag.
- Treasury: 0xd433D14b92c44A608607590eb323BEd9F368D6F4 on Sepolia. Deployed and source verified Exact Match. User authorized/signed 1,000 CLUB42 funding; successful receipt, event, and balance checked independently. Record: deployment/treasury-sepolia.json.
- No signer rotation, cancellation, approval withdrawal, expiry, or asset recovery. Losing two keys can lock funds. Two compromised organizers can spend the reserve. Approved proposals do not reserve funds. Limitations documented.

## Organizers

1. Club42: 0xA798E1210b6e5803Bf491944713Bb5BB5ed3D330
2. Member: 0xe8Ef80B64D6111523c2C96485dcD1B7D847E3f9b
3. Organizer 3: 0xE270edD9ad1F223Fd0e393c809EA6C417818f188

All are user-controlled demonstration accounts; real governance requires independently controlled keys. User reported third account funded with 0.002 SepoliaETH.

## Tooling and client

Use Node 22.23.3 installed in ignored .tools/ (system Node 12 is too old):

```sh
export PATH="$PWD/.tools/node-v22.23.3-linux-x64/bin:$PATH"
npm ci
npm test
npm run client:dev
```

Client: http://127.0.0.1:5173 in Brave. Compiler: solc 0.8.30, optimizer 200 runs, Paris EVM. npm test compiles and runs token/treasury suites. Ganache native warning falls back successfully to JavaScript. npm run client:build builds React.

Deployment server: npm run deploy:local; http://127.0.0.1:4243/treasury deploys treasury (root deploys another token). Both contracts already deployed; avoid accidental redeployment. npm run verification:input -- Club42Treasury creates ignored JSON plus encoded constructor arguments; token verification uses command without the argument.

React token operations and account switching were exercised. Treasury.jsx now reads balance/organizer status/proposals with ten-item pages and 15-second refresh, and provides signer-controlled propose/approve/execute with simulation, shared transaction lock, signer/network checks, and explorer/error feedback. Browser treasury flow is not yet demonstrated.

UI: light fixed-viewport app with internal scrolling, preserved black/lime wallet card, transparent PNG branding, looping H.264 video with sage/lime overlay, card video clipping, gradient dividers/connect button, solid right panel with bottom margin and embedded activity. No hosting configured.

## Resume here: remaining work

1. Open client and Treasury tab; connect original account on Sepolia. Confirm 1,000 CLUB42, organizer status, no proposals (if unchanged).
2. User chooses/authorizes a distribution (suggest 100 CLUB42 to Member). Create proposal; approve separately with first organizer; verify only one approval cannot execute. Switch to second organizer, approve, execute, and independently check receipt/balances. Record transaction hashes. Check duplicate/replay and non-organizer UI behavior; automated contract tests already cover these.
3. Finalize public bonus demonstration documentation. Wrong-network/cancellation and responsive UI wallet checks still need review. Tests/build are required before final push.
4. Resume mock correction and contract walkthrough. User understood modifiers/constructor and proposal storage, then deferred code review. Gas confusion resolved: gas measures work; ETH fee includes burned base fee and proposer tip. Cover treasury functions, failed calls, permissions, tests, deployment, and key/security assumptions.
5. Review supplied subject requirements and separate correction sheet if acquired. Bonus is not finished until public demonstration and final review. Submit to school only when explicitly requested; preserve GitHub origin.

## Save request

User requested updating documentation/handoff and pushing current changes to GitHub main on 2026-10-14, then continuing later. No public treasury proposal, approval, or execution has been demonstrated yet.

## Public bonus demonstration — 2026-10-15

User created proposal #0 for 100 CLUB42 to Member, approved with original account and Organizer 3, then executed with Organizer 3. Independently checked successful tx 0xadf30fa7e1bef0bb8ee4575e31901d47319c16e8df8e4fdfe6ff6ba60a6a35bb (block 11917202), treasury Executed event, token Transfer event, proposal executed=true with two approvals. Treasury balance 900, member 210, total supply 42,000. Read-only replay simulation rejects AlreadyExecuted. Receipt outer destination is wallet routing contract; treasury event/state confirms execution. Initial unsuccessful wallet attempt had no confirmed failed treasury execution receipt; cause unresolved. Demonstration saved in deployment/treasury-sepolia.json. Remaining: final documentation/status cleanup, final tests/build and requested push, wallet edge-case review, code defense preparation and separate submission.
