import React, { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import Deploy from "./Deploy.jsx";
import ExplorerGuide from "./ExplorerGuide.jsx";
import Treasury, { TREASURY_ABI } from "./Treasury.jsx";
import tokenArtifact from "../../artifacts/Club42.json";
import treasuryDefaults from "../../deployment/treasury-config.json";

const KEY = "club42.correction.v1";
const CHAIN = "0xaa36a7";
const explorer = (address) => `https://sepolia.etherscan.io/address/${address}`;
const phases = [
  "Prepare",
  "Deploy token",
  "Explorer & source",
  "Initial state",
  "Token tests",
  "Multisig bonus",
  "Session evidence",
];
const fresh = () => ({
  version: 1,
  id: new Date().toISOString(),
  name: "Correction session",
  phase: 0,
  token: null,
  treasury: null,
  member: "",
  owner: "",
  organizers: treasuryDefaults.organizers,
  events: [],
  checks: {},
  notes: "",
});
function restore() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    if (
      value?.version === 1 &&
      Array.isArray(value.events) &&
      value.checks &&
      Array.isArray(value.organizers) &&
      value.organizers.length === 3 &&
      Number.isInteger(value.phase) &&
      value.phase >= 0 &&
      value.phase < phases.length
    )
      return value;
  } catch {
    /* Browser storage may be unavailable. */
  }
  return fresh();
}
function address(value) {
  if (!ethers.isAddress(value) || value.toLowerCase() === ethers.ZeroAddress)
    throw new Error("Enter a valid non-zero address.");
  return ethers.getAddress(value);
}
const friendly = (e) => e.revert?.name || e.shortMessage || e.message;
export default function Correction(props) {
  const {
    wallet,
    account,
    ready,
    pending,
    setPending,
    locked,
    report,
    reportError,
    setHash,
  } = props;
  const [session, setSession] = useState(restore);
  const [storageError, setStorageError] = useState("");
  const viewRevision = useRef(0);
  const [inspection, setInspection] = useState(null);
  const [recoveryHash, setRecoveryHash] = useState("");
  const [revision, setRevision] = useState(0);
  const [proposalId, setProposalId] = useState("0");
  const [resetArmed, setResetArmed] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(session));
      setStorageError("");
    } catch {
      setStorageError(
        "Browser storage is unavailable or full. Export this session before leaving.",
      );
    }
  }, [session]);
  useEffect(() => {
    viewRevision.current++;
    setInspection(null);
  }, [account, ready, session.token?.address, session.member, session.owner]);
  const patch = (changes) => setSession((s) => ({ ...s, ...changes }));
  const log = (event) =>
    setSession((s) => ({
      ...s,
      events: [
        ...s.events,
        { at: new Date().toISOString(), chainId: 11155111, ...event },
      ],
    }));
  function exportSession() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(session, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `club42-session-${session.id.replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function context() {
    if (!wallet || (await wallet.request({ method: "eth_chainId" })) !== CHAIN)
      throw new Error("Connect MetaMask on Sepolia.");
    const provider = new ethers.BrowserProvider(wallet);
    const signer = await provider.getSigner();
    if ((await signer.getAddress()).toLowerCase() !== account.toLowerCase())
      throw new Error("Wallet account changed. Reconnect before continuing.");
    return { provider, signer };
  }
  async function run(task) {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    try {
      await task();
    } catch (e) {
      reportError(e);
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  async function checkedToken(provider) {
    const target = address(session.token?.address || "");
    if ((await provider.getCode(target)) === "0x")
      throw new Error("No contract code at this session address on Sepolia.");
    const contract = new ethers.Contract(target, tokenArtifact.abi, provider);
    const [name, symbol, decimals, supply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ]);
    if (
      name !== "Club42" ||
      symbol !== "CLUB42" ||
      decimals !== 18n ||
      supply !== ethers.parseUnits("42000", 18)
    )
      throw new Error("Token metadata or supply does not match Club42.");
    return contract;
  }
  async function snapshot(contract, blockTag) {
    const owner = address(session.owner || session.token.deployer);
    const member = address(session.member);
    if (owner.toLowerCase() === member.toLowerCase())
      throw new Error(
        "Choose a member/spender different from the token owner.",
      );
    const opts = { blockTag };
    const [supply, ownerBalance, memberBalance, allowance] = await Promise.all([
      contract.totalSupply(opts),
      contract.balanceOf(owner, opts),
      contract.balanceOf(member, opts),
      contract.allowance(owner, member, opts),
    ]);
    return {
      block: blockTag,
      owner,
      member,
      supply: ethers.formatUnits(supply, 18),
      ownerBalance: ethers.formatUnits(ownerBalance, 18),
      memberBalance: ethers.formatUnits(memberBalance, 18),
      allowance: ethers.formatUnits(allowance, 18),
    };
  }
  function inspect() {
    run(async () => {
      const viewVersion = viewRevision.current;
      const { provider } = await context();
      const token = await checkedToken(provider);
      const block = await provider.getBlockNumber();
      const data = await snapshot(token, block);
      const observation = { token: session.token.address, ...data };
      if (viewVersion === viewRevision.current) setInspection(observation);
      log({ type: "state-read", ...observation });
      report(
        "Metadata and fixed supply match. Balances and allowance read at the recorded block. This is not a bytecode or source-verification check.",
      );
    });
  }
  function recover() {
    run(async () => {
      if (!/^0x[0-9a-fA-F]{64}$/.test(recoveryHash))
        throw new Error("Enter a deployment transaction hash.");
      const { provider } = await context();
      const receipt = await provider.getTransactionReceipt(recoveryHash);
      if (!receipt || receipt.status !== 1 || !receipt.contractAddress)
        throw new Error(
          "A successful direct contract-creation receipt is required. For routed wallet deployments, use the address saved by the deployment view and inspect its explorer receipt.",
        );
      const contract = new ethers.Contract(
        receipt.contractAddress,
        tokenArtifact.abi,
        provider,
      );
      if (
        (await contract.name()) !== "Club42" ||
        (await contract.symbol()) !== "CLUB42" ||
        (await contract.totalSupply()) !== ethers.parseUnits("42000", 18)
      )
        throw new Error("Receipt is not a matching Club42 token.");
      patch({
        token: {
          address: receipt.contractAddress,
          hash: recoveryHash,
          deployer: receipt.from,
          confirmed: true,
          block: receipt.blockNumber,
          recovered: true,
        },
        owner: receipt.from,
        treasury: null,
      });
      log({
        type: "deployment-recovered",
        token: receipt.contractAddress,
        hash: recoveryHash,
      });
      report(
        "Deployment recovered. Compare the published source with the submitted code in the explorer.",
      );
    });
  }
  function transact(method, amount, expectError = false) {
    run(async () => {
      const viewVersion = viewRevision.current;
      const { provider, signer } = await context();
      const token = await checkedToken(provider);
      const owner = address(session.owner || session.token.deployer),
        member = address(session.member);
      const caller = await signer.getAddress();
      const required = method === "transferFrom" ? member : owner;
      if (caller.toLowerCase() !== required.toLowerCase())
        throw new Error(
          `Switch MetaMask to ${method === "transferFrom" ? "the member/spender" : "the token owner"}: ${required}`,
        );
      const value = ethers.parseUnits(amount, 18);
      const args =
        method === "transferFrom" ? [owner, member, value] : [member, value];
      const contract = token.connect(signer);
      const before = await snapshot(token, await provider.getBlockNumber());
      if (expectError) {
        if (before.allowance !== "0.0")
          throw new Error("Revoke the allowance to zero first.");
        let rejection;
        try {
          await contract[method].staticCall(...args);
        } catch (e) {
          if (e.revert?.name !== "ERC20InsufficientAllowance") throw e;
          rejection = e.revert.name;
        }
        if (!rejection)
          throw new Error(
            "Unexpected success: the rejection check did not pass.",
          );
        log({
          type: "expected-rejection",
          method,
          token: session.token.address,
          caller,
          reason: rejection,
          before,
          simulated: true,
        });
        report(
          "Expected ERC20InsufficientAllowance confirmed by simulation. No transaction was sent.",
        );
        return;
      }
      if (
        method === "approve" &&
        value > 0n &&
        ethers.parseUnits(before.allowance, 18) > 0n
      )
        throw new Error(
          "Revoke the existing allowance before setting a new non-zero value.",
        );
      await contract[method].staticCall(...args);
      report(
        `Review ${method} on session token ${session.token.address} in MetaMask.`,
      );
      const tx = await contract[method](...args);
      setHash(tx.hash);
      log({
        type: "submitted",
        token: session.token.address,
        method,
        caller,
        amount,
        hash: tx.hash,
        before,
      });
      try {
        const receipt = await tx.wait();
        const after = await snapshot(token, receipt.blockNumber);
        const events = receipt.logs
          .filter(
            (l) =>
              l.address.toLowerCase() === session.token.address.toLowerCase(),
          )
          .flatMap((l) => {
            try {
              const parsed = token.interface.parseLog(l);
              return parsed
                ? [
                    {
                      name: parsed.name,
                      args: Array.from(parsed.args).map(String),
                    },
                  ]
                : [];
            } catch {
              return [];
            }
          });
        const units = (value) => ethers.parseUnits(value, 18);
        const same = (a, b) => a.toLowerCase() === b.toLowerCase();
        const expectedEvent = events.some(
          (event) =>
            event.name === (method === "approve" ? "Approval" : "Transfer") &&
            same(event.args[0], owner) &&
            same(event.args[1], member) &&
            BigInt(event.args[2]) === value,
        );
        const checks = {
          supplyUnchanged: after.supply === before.supply,
          expectedEvent,
          ownerBalance:
            units(after.ownerBalance) ===
            units(before.ownerBalance) - (method === "approve" ? 0n : value),
          memberBalance:
            units(after.memberBalance) ===
            units(before.memberBalance) + (method === "approve" ? 0n : value),
          allowance:
            units(after.allowance) ===
            (method === "approve"
              ? value
              : method === "transferFrom"
                ? units(before.allowance) - value
                : units(before.allowance)),
        };
        log({
          type: "confirmed",
          token: session.token.address,
          method,
          caller,
          amount,
          hash: tx.hash,
          block: receipt.blockNumber,
          before,
          after,
          events,
          checks,
        });
        if (viewVersion === viewRevision.current)
          setInspection({ token: session.token.address, ...after });
        report(
          Object.values(checks).every(Boolean)
            ? "Transaction confirmed. Expected event, balances, allowance and fixed supply checks match."
            : "Transaction confirmed, but a state/event comparison differs. Inspect the evidence and explorer; concurrent transactions may affect snapshots.",
        );
      } catch (e) {
        log({ type: "receipt-check-error", hash: tx.hash, error: friendly(e) });
        throw new Error(
          `Transaction submitted. Inspect ${tx.hash} before retrying. ${friendly(e)}`,
        );
      }
    });
  }
  function saveDeployment(kind, result) {
    setSession((s) => ({
      ...s,
      [kind]: result,
      ...(kind === "token" ? { owner: result.deployer } : {}),
    }));
    log({
      type: result.checked
        ? "deployment-initial-state-checked"
        : result.confirmed
          ? "deployment-confirmed"
          : "deployment-submitted",
      kind,
      address: result.address,
      hash: result.hash,
      block: result.block,
    });
  }
  function treasuryAction(method, args) {
    return run(async () => {
      const { provider, signer } = await context();
      const target = address(session.treasury.address);
      const contract = new ethers.Contract(
        target,
        [...TREASURY_ABI, "function token() view returns(address)"],
        signer,
      );
      if (
        (await contract.token()).toLowerCase() !==
        session.token.address.toLowerCase()
      )
        throw new Error("Treasury is not linked to this session token.");
      await checkedToken(provider);
      await contract[method].staticCall(...args);
      const tx = await contract[method](...args);
      setHash(tx.hash);
      log({
        type: "submitted",
        kind: "treasury",
        address: target,
        method,
        args: args.map(String),
        hash: tx.hash,
      });
      try {
        const receipt = await tx.wait();
        log({
          type: "confirmed",
          kind: "treasury",
          address: target,
          method,
          hash: tx.hash,
          block: receipt.blockNumber,
        });
        setRevision((n) => n + 1);
        report(
          "Session treasury transaction confirmed. Inspect its explorer events.",
        );
      } catch (e) {
        throw new Error(
          `Submitted ${tx.hash}; inspect explorer before retrying. ${friendly(e)}`,
        );
      }
    });
  }
  function checkTreasury(expected) {
    run(async () => {
      if (!/^\d+$/.test(proposalId))
        throw new Error("Enter a non-negative proposal ID.");
      const { signer } = await context();
      const contract = new ethers.Contract(
        address(session.treasury.address),
        [...TREASURY_ABI, "function token() view returns(address)"],
        signer,
      );
      if (
        (await contract.token()).toLowerCase() !==
        session.token.address.toLowerCase()
      )
        throw new Error("Treasury token mismatch.");
      const id = BigInt(proposalId);
      const proposal = await contract.proposals(id);
      if (
        expected === "InsufficientApprovals" &&
        (proposal.approvals !== 1n || proposal.executed)
      )
        throw new Error(
          "This check requires exactly one approval on a pending proposal.",
        );
      if (expected === "AlreadyExecuted" && !proposal.executed)
        throw new Error("Execute this proposal before checking replay.");
      let reason;
      try {
        await contract.execute.staticCall(id);
      } catch (e) {
        if (e.revert?.name !== expected) throw e;
        reason = e.revert.name;
      }
      if (!reason)
        throw new Error("Unexpected success: rejection check did not pass.");
      log({
        type: "expected-rejection",
        kind: "treasury",
        address: session.treasury.address,
        proposalId,
        reason,
        simulated: true,
      });
      report(
        `Expected ${reason} confirmed by simulation. No transaction sent.`,
      );
    });
  }
  function fundTreasury() {
    run(async () => {
      const { provider, signer } = await context();
      const token = (await checkedToken(provider)).connect(signer);
      const target = address(session.treasury.address);
      const treasury = new ethers.Contract(
        target,
        ["function token() view returns(address)"],
        provider,
      );
      if (
        (await treasury.token()).toLowerCase() !==
        session.token.address.toLowerCase()
      )
        throw new Error("Treasury token mismatch.");
      const value = ethers.parseUnits("1000", 18);
      await token.transfer.staticCall(target, value);
      const tx = await token.transfer(target, value);
      setHash(tx.hash);
      log({
        type: "submitted",
        method: "treasury-funding",
        token: session.token.address,
        target,
        hash: tx.hash,
      });
      try {
        const receipt = await tx.wait();
        log({
          type: "confirmed",
          method: "treasury-funding",
          hash: tx.hash,
          block: receipt.blockNumber,
        });
        setRevision((n) => n + 1);
        report("1,000 session CLUB42 transferred to the session treasury.");
      } catch (e) {
        throw new Error(
          `Submitted ${tx.hash}; inspect explorer before retrying. ${friendly(e)}`,
        );
      }
    });
  }
  const deploymentProps = {
    wallet,
    account,
    ready,
    pending,
    setPending,
    locked,
    report,
    reportError,
    setHash,
  };
  const tokenReady = !!session.token?.confirmed;
  const check = (key, text) => (
    <label className="manual-check">
      <input
        type="checkbox"
        disabled={pending}
        checked={!!session.checks[key]}
        onChange={(e) =>
          patch({ checks: { ...session.checks, [key]: e.target.checked } })
        }
      />
      {text} <small>Manual confirmation</small>
    </label>
  );
  return (
    <section className="correction-page">
      <div className="session-heading">
        <div>
          <p className="eyebrow">LIVE DEFENSE · SEPOLIA ONLY</p>
          <h1>Correction session</h1>
        </div>
        <button onClick={exportSession}>Export evidence ↓</button>
      </div>
      {storageError && (
        <p role="alert" className="warning">
          {storageError}
        </p>
      )}
      <div className="session-contract">
        <strong>{session.name}</strong>
        <p>
          Token:{" "}
          {session.token ? (
            <a
              href={explorer(session.token.address)}
              target="_blank"
              rel="noreferrer"
            >
              {session.token.address} ↗{" "}
              {session.token.confirmed
                ? "· confirmed"
                : "· submitted, check receipt"}
            </a>
          ) : (
            "Not deployed for this session"
          )}
        </p>
        <p>
          Wallet: {account || "Not connected"} ·{" "}
          {ready ? "Sepolia" : "Connect on Sepolia to run checks"}
        </p>
      </div>
      <nav className="phase-nav" aria-label="Correction phases">
        {phases.map((label, i) => (
          <button
            key={label}
            disabled={pending}
            aria-current={session.phase === i ? "step" : undefined}
            className={session.phase === i ? "active" : ""}
            onClick={() => patch({ phase: i })}
          >
            {i + 1}. {label}
          </button>
        ))}
      </nav>
      <article className="study-content">
        <p className="eyebrow">
          PHASE {session.phase + 1} OF {phases.length}
        </p>
        <h2>{phases[session.phase]}</h2>
        {session.phase === 0 && (
          <>
            <p>
              This guide prepares for the saved unofficial checklist. Your
              assigned scale and evaluator determine the actual evaluation. Each
              session uses independent contracts and evidence; the original
              dashboard stays linked to the recorded deployment.
            </p>
            <ExplorerGuide
              token={session.token?.address}
              owner={session.owner || session.token?.deployer}
              member={session.member}
            />
            <label>
              Session label
              <input
                disabled={pending}
                value={session.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
            </label>
            {check(
              "repository",
              "Clone the submitted repository into an empty folder; review code/, deployment/, documentation/ and README.",
            )}
            {check(
              "tools",
              "Activate Node 22, install with npm ci, run npm test and npm run client:build.",
            )}
            {check(
              "wallet",
              "Prepare owner/member accounts with SepoliaETH; review the scripts together. Never share signing keys.",
            )}
            <label>
              Member / delegated spender address
              <input
                disabled={pending}
                value={session.member}
                onChange={(e) => patch({ member: e.target.value })}
                placeholder="0x…"
              />
            </label>
            <p>
              The owner deploys, transfers and approves. This different member
              account later calls transferFrom and pays its own gas.
            </p>
          </>
        )}
        {session.phase === 1 && (
          <>
            <p>
              Deploy the submitted Club42 code with the intended owner account.
              Submission locks another deployment for this session. A pending
              deployment can be checked in the explorer before continuing.
            </p>
            <Deploy
              key={session.id}
              {...deploymentProps}
              tokenOnly
              initialResult={session.token}
              onResult={(result) => saveDeployment("token", result)}
            />
            <details>
              <summary>Recover a direct deployment by transaction hash</summary>
              <p>
                Use this if a receipt was missed. Recovery checks the receipt
                and token metadata, not source equivalence. Source verification
                remains necessary.
              </p>
              <label>
                Deployment transaction hash
                <input
                  disabled={pending}
                  value={recoveryHash}
                  onChange={(e) => setRecoveryHash(e.target.value)}
                />
              </label>
              <button
                disabled={!ready || pending || !!session.token}
                onClick={recover}
              >
                Recover deployment
              </button>
            </details>
            {session.token && (
              <p>
                Reloaded after submission? Open the saved transaction to confirm
                its status.{" "}
                {session.token.confirmed ? (
                  "Confirmation was saved."
                ) : (
                  <button
                    disabled={!ready || pending}
                    onClick={() => {
                      setRecoveryHash(session.token.hash);
                      run(async () => {
                        const { provider } = await context();
                        const receipt = await provider.getTransactionReceipt(
                          session.token.hash,
                        );
                        if (!receipt || receipt.status !== 1)
                          throw new Error(
                            "No successful receipt yet. Inspect the explorer.",
                          );
                        await checkedToken(provider);
                        patch({
                          token: {
                            ...session.token,
                            confirmed: true,
                            block: receipt.blockNumber,
                          },
                        });
                        log({
                          type: "deployment-receipt-rechecked",
                          hash: session.token.hash,
                          block: receipt.blockNumber,
                        });
                        report(
                          "Successful receipt and matching token metadata confirmed.",
                        );
                      });
                    }}
                  >
                    Recheck saved receipt
                  </button>
                )}
              </p>
            )}
          </>
        )}
        {session.phase === 2 && (
          <>
            <p>
              Use the explorer for independent evidence. Deployment installs
              code; publishing and verifying source is a separate task.
            </p>
            {tokenReady ? (
              <div className="external-links">
                <a
                  href={`${explorer(session.token.address)}#code`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Contract & source ↗
                </a>
                <a
                  href={`${explorer(session.token.address)}#readContract`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read Contract ↗
                </a>
                <a
                  href={`${explorer(session.token.address)}#writeContract`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Write Contract ↗
                </a>
                <a
                  href={`https://sepolia.etherscan.io/verifyContract?a=${session.token.address}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Verify & publish ↗
                </a>
              </div>
            ) : (
              <p>Confirm the session token deployment first.</p>
            )}
            <ol>
              <li>
                Generate the self-contained input:{" "}
                <code>npm run verification:input</code>.
              </li>
              <li>
                Choose Solidity Standard JSON Input. Use{" "}
                <code>artifacts/Club42.standard-input.json</code>, compiler
                0.8.30, optimizer 200 runs, Paris EVM, MIT license. Club42 has
                no constructor arguments.
              </li>
              <li>
                Confirm the verified source corresponds to this address and
                submitted code.
              </li>
              <li>
                In Read Contract: name, symbol, decimals, totalSupply, balanceOf
                and allowance.
              </li>
              <li>
                In Write Contract: connect the correct account on Sepolia;
                transfer, approve or transferFrom. Amounts there are base units:
                100 CLUB42 is <code>100000000000000000000</code>.
              </li>
            </ol>
            {check(
              "source",
              "Source verified on the session token address; name, ticker, address and network checked.",
            )}
            <p>
              Our UI is optional. Explorer writes also require wallet signing
              and test ETH. If you perform actions there, refresh state here and
              keep those hashes in session notes.
            </p>
          </>
        )}
        {(session.phase === 3 || session.phase === 4) && (
          <>
            <label>
              Token owner
              <input
                disabled={pending}
                value={session.owner}
                onChange={(e) => patch({ owner: e.target.value })}
              />
            </label>
            <label>
              Member / spender
              <input
                disabled={pending}
                value={session.member}
                onChange={(e) => patch({ member: e.target.value })}
              />
            </label>
            <button
              disabled={!ready || pending || !tokenReady}
              onClick={inspect}
            >
              Read metadata, balances & allowance
            </button>
            {inspection && (
              <div className="state-grid">
                {Object.entries(inspection).map(([key, value]) => (
                  <div key={key}>
                    <span>{key}</span>
                    <strong>{String(value)}</strong>
                  </div>
                ))}
              </div>
            )}
            {session.phase === 3 ? (
              <>
                <p>
                  Before any distribution, expect supply 42,000, deployer
                  balance 42,000, member balance 0 and allowance 0. Later reads
                  reflect your transactions. Metadata matching alone does not
                  establish identical contract code.
                </p>
                {check(
                  "initial",
                  "Compared initial state with expectations before performing token operations.",
                )}
              </>
            ) : (
              <>
                <p>
                  Follow these steps once in order. Transfers are repeatable:
                  use the evidence list before clicking again. Each button
                  checks the signing account and simulates first. State
                  snapshots and receipt events are saved for comparison;
                  concurrent transactions can affect balance differences.
                </p>
                <ol className="test-sequence">
                  <li>
                    Owner sends 100 to member.
                    <button
                      disabled={!ready || pending || !tokenReady}
                      onClick={() => transact("transfer", "100")}
                    >
                      Send 100
                    </button>
                  </li>
                  <li>
                    Owner approves member for 25. No balance should move.
                    <button
                      disabled={!ready || pending || !tokenReady}
                      onClick={() => transact("approve", "25")}
                    >
                      Approve 25
                    </button>
                  </li>
                  <li>
                    Switch wallet to member. Move 10 from owner to member;
                    finite allowance becomes 15.
                    <button
                      disabled={!ready || pending || !tokenReady}
                      onClick={() => transact("transferFrom", "10")}
                    >
                      Spend 10
                    </button>
                  </li>
                  <li>
                    Switch back to owner and revoke to zero.
                    <button
                      disabled={!ready || pending || !tokenReady}
                      onClick={() => transact("approve", "0")}
                    >
                      Revoke allowance
                    </button>
                  </li>
                  <li>
                    Switch to member. Simulate spending 1; require the precise
                    insufficient-allowance error.
                    <button
                      disabled={!ready || pending || !tokenReady}
                      onClick={() => transact("transferFrom", "1", true)}
                    >
                      Check expected rejection · no gas
                    </button>
                  </li>
                </ol>
                <p>
                  After this exact sequence: owner 41,890, member 110, allowance
                  0, supply 42,000. Assumes fresh accounts/state and no other
                  transfers.
                </p>
                {check(
                  "operations",
                  "Compared receipt events and state changes with the expected sequence in the explorer.",
                )}
              </>
            )}
          </>
        )}
        {session.phase === 5 && (
          <>
            <p>
              Optional, after mandatory requirements pass. This treasury must
              use this session token. Losing two keys can lock funds; two
              compromised organizers can spend them. Organizers are immutable.
            </p>
            {session.organizers.map((value, i) => (
              <label key={i}>
                Organizer {i + 1}
                <input
                  disabled={pending || !!session.treasury}
                  value={value}
                  onChange={(e) =>
                    patch({
                      organizers: session.organizers.map((v, n) =>
                        n === i ? e.target.value : v,
                      ),
                    })
                  }
                />
              </label>
            ))}
            {tokenReady ? (
              <>
                <Deploy
                  key={`${session.id}-treasury`}
                  {...deploymentProps}
                  initialKind="treasury"
                  fixedKind
                  initialResult={session.treasury}
                  sessionConfig={{
                    token: session.token.address,
                    organizers: session.organizers,
                    requiredApprovals: 2,
                  }}
                  onResult={(result) => saveDeployment("treasury", result)}
                />
                {session.treasury && !session.treasury.confirmed && (
                  <button
                    disabled={!ready || pending}
                    onClick={() =>
                      run(async () => {
                        const { provider } = await context();
                        const receipt = await provider.getTransactionReceipt(
                          session.treasury.hash,
                        );
                        if (!receipt || receipt.status !== 1)
                          throw new Error("No successful receipt yet.");
                        const contract = new ethers.Contract(
                          session.treasury.address,
                          ["function token() view returns(address)"],
                          provider,
                        );
                        if (
                          (await contract.token()).toLowerCase() !==
                          session.token.address.toLowerCase()
                        )
                          throw new Error("Treasury token mismatch.");
                        patch({
                          treasury: {
                            ...session.treasury,
                            confirmed: true,
                            block: receipt.blockNumber,
                          },
                        });
                        report("Treasury receipt and token linkage checked.");
                      })
                    }
                  >
                    Recheck treasury receipt
                  </button>
                )}
                {session.treasury?.confirmed && (
                  <>
                    <button disabled={!ready || pending} onClick={fundTreasury}>
                      Transfer 1,000 session CLUB42 to treasury
                    </button>
                    <p>
                      Funding is repeatable. Check its balance and receipts
                      first. Propose 100 to the member, approve with organizer
                      A, then B, and execute once. Proposing grants no approval.
                    </p>
                    <Treasury
                      wallet={wallet}
                      account={account}
                      ready={ready}
                      pending={pending}
                      act={treasuryAction}
                      reportError={reportError}
                      revision={revision}
                      recordOverride={{
                        contractAddress: session.treasury.address,
                        token: session.token.address,
                        explorer: explorer(session.treasury.address),
                      }}
                    />
                    <label>
                      Proposal ID for rejection checks
                      <input
                        disabled={pending}
                        value={proposalId}
                        onChange={(e) => setProposalId(e.target.value)}
                      />
                    </label>
                    <button
                      disabled={!ready || pending}
                      onClick={() => checkTreasury("InsufficientApprovals")}
                    >
                      Check one-approval rejection · no gas
                    </button>
                    <button
                      disabled={!ready || pending}
                      onClick={() => checkTreasury("AlreadyExecuted")}
                    >
                      Check replay rejection · no gas
                    </button>
                    <details>
                      <summary>
                        Independent bonus checks & source verification
                      </summary>
                      <p>
                        In the treasury explorer, verify source and inspect
                        organizers, approvals and proposal state. Simulate
                        execute with one approval to observe
                        InsufficientApprovals; after execution simulate replay
                        to observe AlreadyExecuted. Use read-only eth_call via
                        your chosen tool; do not send intentional failures.
                      </p>
                      <p>
                        Generate treasury Standard JSON with npm run
                        verification:input -- Club42Treasury. The generated
                        constructor-args file uses the original config, so use
                        the session-specific constructor encoding below instead:
                      </p>
                      <code>
                        {ethers.AbiCoder.defaultAbiCoder()
                          .encode(
                            ["address", "address[3]"],
                            [session.token.address, session.organizers],
                          )
                          .slice(2)}
                      </code>
                      <p>
                        Open{" "}
                        <a
                          href={`${explorer(session.treasury.address)}#code`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          session treasury source ↗
                        </a>
                        . Compiler/settings match the token.
                      </p>
                    </details>
                    {check(
                      "bonus",
                      "Verified treasury source, two distinct approvals, one-approval rejection, execution and replay rejection.",
                    )}
                  </>
                )}
              </>
            ) : (
              <p>Confirm the session token first.</p>
            )}
          </>
        )}
        {session.phase === 6 && (
          <>
            <p>
              Evidence is stored in this browser only. Export before moving
              machines or clearing browser data. Manual confirmations are
              separate from on-chain observations; the guide does not assign a
              grade.
            </p>
            <label>
              Notes · external transaction hashes and observed results
              <textarea
                disabled={pending}
                rows="6"
                value={session.notes}
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </label>
            <p>
              {session.events.filter((e) => e.type === "confirmed").length}{" "}
              confirmed operation records ·{" "}
              {
                session.events.filter((e) => e.type === "expected-rejection")
                  .length
              }{" "}
              expected rejection records ·{" "}
              {Object.values(session.checks).filter(Boolean).length} manual
              confirmations.
            </p>
            <button onClick={exportSession}>Download session JSON</button>
            <hr />
            <p>
              Starting another session clears this browser’s active record.
              Export the current one first.
            </p>
            {!resetArmed ? (
              <button disabled={pending} onClick={() => setResetArmed(true)}>
                Start another correction…
              </button>
            ) : (
              <>
                <button
                  disabled={pending}
                  onClick={() => {
                    exportSession();
                    setSession(fresh());
                    setInspection(null);
                    setResetArmed(false);
                  }}
                >
                  Export current & start new
                </button>
                <button onClick={() => setResetArmed(false)}>
                  Keep current session
                </button>
              </>
            )}
          </>
        )}
        <div className="chapter-controls">
          <button
            disabled={pending || session.phase === 0}
            onClick={() => patch({ phase: session.phase - 1 })}
          >
            ← Previous phase
          </button>
          <button
            disabled={pending || session.phase === phases.length - 1}
            onClick={() => patch({ phase: session.phase + 1 })}
          >
            Next phase →
          </button>
        </div>
      </article>
      <details className="session-log">
        <summary>Session evidence · {session.events.length} records</summary>
        {!session.events.length && <p>No observations recorded yet.</p>}
        {session.events
          .slice()
          .reverse()
          .map((event, i) => (
            <article key={i}>
              <strong>
                {event.type} · {event.method || event.kind || ""}
              </strong>
              <p>{event.at}</p>
              {event.hash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${event.hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Transaction ↗
                </a>
              )}
              <pre>{JSON.stringify(event, null, 2)}</pre>
            </article>
          ))}
      </details>
    </section>
  );
}
