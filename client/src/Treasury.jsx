import React, { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import record from "../../deployment/treasury-sepolia.json";

export const TREASURY_ABI = [
  "function proposalCount() view returns(uint256)",
  "function proposals(uint256) view returns(address recipient,uint256 amount,uint256 approvals,bool executed)",
  "function approved(uint256,address) view returns(bool)",
  "function isOrganizer(address) view returns(bool)",
  "function propose(address,uint256) returns(uint256)",
  "function approve(uint256)",
  "function execute(uint256)",
  ...[
    "NotOrganizer",
    "InvalidProposal",
    "InvalidRecipient",
    "InvalidAmount",
    "AlreadyApproved",
    "AlreadyExecuted",
    "InsufficientApprovals",
  ].map((name) => `error ${name}()`),
  "error ERC20InsufficientBalance(address,uint256,uint256)",
];
export default function Treasury({
  wallet,
  account,
  ready,
  pending,
  act,
  reportError,
  revision,
  recordOverride,
}) {
  const activeRecord = recordOverride || record;
  const [data, setData] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const version = ++generation.current;
    let running = false;
    setData(null);
    async function read() {
      if (!ready || running) return;
      running = true;
      try {
        const provider = new ethers.BrowserProvider(wallet);
        const contract = new ethers.Contract(
          activeRecord.contractAddress,
          TREASURY_ABI,
          provider,
        );
        const token = new ethers.Contract(
          activeRecord.token,
          ["function balanceOf(address) view returns(uint256)"],
          provider,
        );
        const [count, balance, organizer] = await Promise.all([
          contract.proposalCount(),
          token.balanceOf(activeRecord.contractAddress),
          contract.isOrganizer(account),
        ]);
        // Page in groups of ten, newest first, without reading unbounded history.
        const end = count > BigInt(page * 10) ? count - BigInt(page * 10) : 0n;
        const start = end > 10n ? end - 10n : 0n;
        const ids = [];
        for (let id = end; id > start; ) ids.push(--id);
        const rows = await Promise.all(
          ids.map(async (id) => {
            const [proposal, voted] = await Promise.all([
              contract.proposals(id),
              contract.approved(id, account),
            ]);
            return { id, ...proposal.toObject(), voted };
          }),
        );
        if (version === generation.current)
          setData({ count, balance, organizer, rows });
      } catch (e) {
        if (version === generation.current) reportError(e);
      } finally {
        running = false;
      }
    }
    read();
    const timer = setInterval(read, 15000);
    return () => {
      generation.current++;
      clearInterval(timer);
    };
  }, [
    wallet,
    account,
    ready,
    page,
    reload,
    revision,
    activeRecord.contractAddress,
    activeRecord.token,
  ]);
  async function propose(event) {
    event.preventDefault();
    try {
      const target = recipient.trim();
      if (
        !ethers.isAddress(target) ||
        target.toLowerCase() === ethers.ZeroAddress ||
        target.toLowerCase() === activeRecord.contractAddress.toLowerCase()
      )
        throw new Error("Enter a valid recipient outside the treasury.");
      if (!/^\d+(\.\d{1,18})?$/.test(amount.trim()))
        throw new Error(
          "Enter a positive token amount with at most 18 decimals.",
        );
      const value = ethers.parseUnits(amount.trim(), 18);
      if (value === 0n) throw new Error("Amount must be greater than zero.");
      await act("propose", [ethers.getAddress(target), value]);
      setReload((n) => n + 1);
    } catch (e) {
      reportError(e);
    }
  }
  async function action(method, id) {
    await act(method, [id]);
    setReload((n) => n + 1);
  }
  return (
    <div className="treasury">
      <h2>Shared treasury</h2>
      <p>
        {data ? ethers.formatUnits(data.balance, 18) : "—"} CLUB42 · 2 of 3
        approvals required
      </p>
      <a href={activeRecord.explorer} target="_blank" rel="noreferrer">
        Treasury explorer ↗
      </a>
      <p className="hint">
        {!ready
          ? "Connect on Sepolia to view proposals."
          : !data
            ? "Loading treasury…"
            : data.organizer
              ? "You are an organizer. Creating a proposal does not approve it."
              : "View only: this account is not an organizer."}
      </p>
      <form onSubmit={propose}>
        <fieldset disabled={!ready || !data?.organizer || pending}>
          <label>
            Recipient
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x…"
              required
              spellCheck="false"
            />
          </label>
          <label>
            Amount · CLUB42
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              inputMode="decimal"
              required
            />
          </label>
          <button className="primary" type="submit">
            Propose distribution →
          </button>
        </fieldset>
      </form>
      <div className="proposal-heading">
        <h3>Proposals</h3>
        <button
          disabled={!ready || pending}
          onClick={() => setReload((n) => n + 1)}
        >
          Refresh
        </button>
      </div>
      {data?.count === 0n && <p>No proposals yet.</p>}
      {data?.rows.map((p) => (
        <article className="proposal" key={p.id.toString()}>
          <strong>
            #{p.id.toString()} · {ethers.formatUnits(p.amount, 18)} CLUB42
          </strong>
          <p className="proposal-address">To: {p.recipient}</p>
          <p>
            {p.approvals.toString()}/2 approvals ·{" "}
            {p.executed ? "Executed" : "Pending"}
            {p.voted ? " · You approved" : ""}
          </p>
          <button
            disabled={
              pending || !ready || !data.organizer || p.executed || p.voted
            }
            onClick={() => action("approve", p.id)}
          >
            Approve
          </button>{" "}
          <button
            disabled={
              pending ||
              !ready ||
              !data.organizer ||
              p.executed ||
              p.approvals < 2n
            }
            onClick={() => action("execute", p.id)}
          >
            Execute
          </button>
        </article>
      ))}
      {data && (
        <div className="proposal-pages">
          <button
            disabled={page === 0 || pending}
            onClick={() => setPage((p) => p - 1)}
          >
            Newer
          </button>
          <span>Page {page + 1}</span>
          <button
            disabled={BigInt((page + 1) * 10) >= data.count || pending}
            onClick={() => setPage((p) => p + 1)}
          >
            Older
          </button>
        </div>
      )}
      <p className="hint">
        Proposals refresh every 15 seconds while open. Approvals cannot be
        withdrawn or expire. Review recipient and amount before signing. All
        writes need SepoliaETH.
      </p>
    </div>
  );
}
