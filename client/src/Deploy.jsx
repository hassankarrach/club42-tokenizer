import React, { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import tokenArtifact from "../../artifacts/Club42.json";
import treasuryArtifact from "../../artifacts/Club42Treasury.json";
import config from "../../deployment/treasury-config.json";

const CHAIN = "0xaa36a7";
export default function Deploy({
  wallet,
  account,
  ready,
  pending,
  setPending,
  locked,
  report,
  reportError,
  setHash,
  sessionConfig = config,
  initialKind = "token",
  initialResult = null,
  onResult,
  tokenOnly = false,
  fixedKind = false,
}) {
  const [kind, setKind] = useState(initialKind);
  const [prepared, setPrepared] = useState(null);
  const [result, setResult] = useState(initialResult);
  const submitted = useRef(!!initialResult);
  const revision = useRef(0);
  useEffect(() => {
    if (initialResult) {
      setResult(initialResult);
      submitted.current = true;
    }
  }, [initialResult]);
  useEffect(() => {
    const invalidate = () => {
      revision.current++;
      setPrepared(null);
    };
    invalidate();
    wallet?.on?.("accountsChanged", invalidate);
    wallet?.on?.("chainChanged", invalidate);
    wallet?.on?.("disconnect", invalidate);
    return () => {
      revision.current++;
      wallet?.removeListener?.("accountsChanged", invalidate);
      wallet?.removeListener?.("chainChanged", invalidate);
      wallet?.removeListener?.("disconnect", invalidate);
    };
  }, [
    wallet,
    account,
    ready,
    kind,
    sessionConfig.token,
    sessionConfig.organizers.join(","),
    sessionConfig.requiredApprovals,
  ]);
  async function session() {
    if (!wallet || (await wallet.request({ method: "eth_chainId" })) !== CHAIN)
      throw new Error("Connect MetaMask on Sepolia first.");
    const provider = new ethers.BrowserProvider(wallet);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    if (address.toLowerCase() !== account.toLowerCase())
      throw new Error("Account changed. Reconnect and estimate again.");
    return { provider, signer, address };
  }
  async function estimate() {
    if (locked.current || submitted.current) return;
    locked.current = true;
    setPending(true);
    setPrepared(null);
    setHash("");
    const version = revision.current;
    try {
      const { provider, signer, address } = await session();
      const artifact = kind === "token" ? tokenArtifact : treasuryArtifact;
      let args = [];
      if (kind === "treasury") {
        if (
          sessionConfig.requiredApprovals !== 2 ||
          sessionConfig.organizers.length !== 3 ||
          new Set(sessionConfig.organizers.map((a) => a.toLowerCase())).size !==
            3 ||
          [sessionConfig.token, ...sessionConfig.organizers].some(
            (a) =>
              !ethers.isAddress(a) || a.toLowerCase() === ethers.ZeroAddress,
          )
        )
          throw new Error("Invalid treasury configuration.");
        const token = new ethers.Contract(
          sessionConfig.token,
          [
            "function symbol() view returns(string)",
            "function totalSupply() view returns(uint256)",
          ],
          provider,
        );
        if (
          (await token.symbol()) !== "CLUB42" ||
          (await token.totalSupply()) !== ethers.parseUnits("42000", 18)
        )
          throw new Error("Unexpected token metadata or supply.");
        args = [sessionConfig.token, sessionConfig.organizers];
      }
      const factory = new ethers.ContractFactory(
        artifact.abi,
        artifact.bytecode,
        signer,
      );
      const gas = await signer.estimateGas(
        await factory.getDeployTransaction(...args),
      );
      const fees = await provider.getFeeData();
      const price = fees.maxFeePerGas ?? fees.gasPrice;
      if (price === null)
        throw new Error("Fee estimate unavailable. Try again.");
      const fee = gas * price;
      if ((await provider.getBalance(address)) < fee)
        throw new Error(
          "Insufficient SepoliaETH for the estimated deployment fee.",
        );
      if (version !== revision.current)
        throw new Error("Wallet changed. Estimate again.");
      setPrepared({
        artifact,
        args,
        address,
        gas: gas.toString(),
        fee: ethers.formatEther(fee),
        kind,
      });
      report(
        "Estimate ready. Review the deployment details and final fee in MetaMask.",
      );
    } catch (e) {
      reportError(e);
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  async function deploy() {
    if (locked.current || !prepared || submitted.current) return;
    locked.current = true;
    setPending(true);
    const snapshot = prepared;
    const version = revision.current;
    try {
      const { signer, address } = await session();
      if (
        version !== revision.current ||
        address.toLowerCase() !== snapshot.address.toLowerCase()
      )
        throw new Error("Wallet changed. Estimate again.");
      report(
        "Review deployment in MetaMask. Check the account, Sepolia network, and fee.",
      );
      const contract = await new ethers.ContractFactory(
        snapshot.artifact.abi,
        snapshot.artifact.bytecode,
        signer,
      ).deploy(...snapshot.args);
      submitted.current = true;
      const tx = contract.deploymentTransaction();
      const contractAddress = await contract.getAddress();
      const next = {
        address: contractAddress,
        hash: tx.hash,
        confirmed: false,
        deployer: address,
        kind: snapshot.kind,
      };
      setHash(tx.hash);
      setResult(next);
      onResult?.(next);
      report(
        "Deployment submitted. Waiting for confirmation. Save the address and transaction; check the explorer before retrying.",
      );
      const receipt = await tx.wait();
      const confirmed = {
        ...next,
        confirmed: true,
        block: receipt.blockNumber,
      };
      setResult(confirmed);
      onResult?.(confirmed);
      if (snapshot.kind === "token") {
        const supply = await contract.totalSupply();
        if (
          supply !== ethers.parseUnits("42000", 18) ||
          (await contract.balanceOf(address)) !== supply
        )
          throw new Error("Unexpected supply or deployer balance.");
      } else {
        if (
          (await contract.token()).toLowerCase() !==
            snapshot.args[0].toLowerCase() ||
          (await contract.REQUIRED_APPROVALS()) !== 2n ||
          (await contract.proposalCount()) !== 0n
        )
          throw new Error("Unexpected treasury configuration.");
        for (let i = 0; i < 3; i++)
          if (
            (await contract.organizers(i)).toLowerCase() !==
            snapshot.args[1][i].toLowerCase()
          )
            throw new Error("Unexpected organizer address.");
      }
      onResult?.({ ...confirmed, checked: true });
      report(
        `Deployment confirmed and initial state checked. ${snapshot.kind === "token" ? "42,000 CLUB42 assigned to the deployer." : "Treasury funding is a separate action."} Explorer source verification is still required.`,
      );
    } catch (e) {
      if (!submitted.current) setPrepared(null);
      reportError(
        submitted.current
          ? new Error(
              `Deployment submitted; check its explorer link before retrying. ${e.shortMessage || e.message}`,
            )
          : e,
      );
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return (
    <article className="actions deployment-view">
      <h2>Deploy on Sepolia</h2>
      <p>
        Each deployment creates a separate contract with a new address. Your
        existing Club42 token and treasury remain available in the Token view.
      </p>
      <div className="tabs" role="group" aria-label="Contract to deploy">
        {(fixedKind
          ? [
              [
                initialKind,
                initialKind === "token" ? "Club42 token" : "Multisig treasury",
              ],
            ]
          : tokenOnly
            ? [["token", "Club42 token"]]
            : [
                ["token", "Club42 token"],
                ["treasury", "Multisig treasury"],
              ]
        ).map(([value, label]) => (
          <button
            key={value}
            className={kind === value ? "active" : ""}
            disabled={pending || !!result}
            onClick={() => {
              setPrepared(null);
              setKind(value);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {kind === "token" ? (
        <p>
          Creates 42,000 CLUB42 with 18 decimals, all assigned to the signing
          account. Supply is fixed.
        </p>
      ) : (
        <div className="deployment-config">
          <p>Creates an empty two-of-three treasury for this token:</p>
          <p>{sessionConfig.token}</p>
          <p>Organizers:</p>
          <ol>
            {sessionConfig.organizers.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
          <p>
            Funding is a separate transaction. Organizers cannot be changed
            after deployment.
          </p>
        </div>
      )}
      <button
        className="subtle"
        disabled={!ready || pending || !!result}
        onClick={estimate}
      >
        1. Estimate deployment fee
      </button>
      {prepared && (
        <div className="deployment-config">
          <p>Network: Sepolia · 11155111</p>
          <p>Deployer: {prepared.address}</p>
          <p>Estimated gas: {prepared.gas}</p>
          <p>Estimated maximum fee: {prepared.fee} SepoliaETH</p>
          <p>The final fee may change. Review it in MetaMask.</p>
        </div>
      )}
      <button
        className="primary"
        disabled={!ready || pending || !prepared || !!result}
        onClick={deploy}
      >
        {pending ? "Request in progress…" : "2. Deploy with MetaMask"}
      </button>
      {result && (
        <div className="deployment-config">
          <h3>
            {result.confirmed ? "Deployment confirmed" : "Deployment submitted"}
          </h3>
          <p>
            Contract:{" "}
            <a
              href={`https://sepolia.etherscan.io/address/${result.address}`}
              target="_blank"
              rel="noreferrer"
            >
              {result.address} ↗
            </a>
          </p>
          <p>
            Transaction:{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${result.hash}`}
              target="_blank"
              rel="noreferrer"
            >
              {result.hash} ↗
            </a>
          </p>
          {result.confirmed && <p>Block: {result.block}</p>}
          <p>
            Save these details separately for a rehearsal. Source verification
            is a separate step. This page does not replace the recorded
            contracts used by the client.
          </p>
        </div>
      )}
      <p className="hint">
        Once submitted, another deployment is blocked in this view.{" "}
        {onResult
          ? "The correction session also saves this protection in browser storage;"
          : "Reloading or leaving this view resets that protection;"}{" "}
        check the explorer before retrying.
      </p>
    </article>
  );
}
