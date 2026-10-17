import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ethers } from "ethers";
import deployment from "../../deployment/sepolia.json";
import "./style.css";
import Deploy from "./Deploy.jsx";
const Learn = lazy(() => import("./Learn.jsx"));
const Correction = lazy(() => import("./Correction.jsx"));
import Treasury, { TREASURY_ABI } from "./Treasury.jsx";
import treasuryRecord from "../../deployment/treasury-sepolia.json";

// Token operations use the public interface; /deploy loads compiled deployment artifacts.
const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function transferFrom(address,address,uint256) returns (bool)",
];
// Include custom errors so ethers can decode reverted simulations.
ABI.push(
  "error ERC20InsufficientAllowance(address spender,uint256 allowance,uint256 needed)",
  "error ERC20InsufficientBalance(address sender,uint256 balance,uint256 needed)",
  "error ERC20InvalidSender(address sender)",
  "error ERC20InvalidReceiver(address receiver)",
  "error ERC20InvalidApprover(address approver)",
  "error ERC20InvalidSpender(address spender)",
);
const CHAIN = "0xaa36a7";
const short = (address) => `${address.slice(0, 6)}…${address.slice(-4)}`;
const format = (value) => ethers.formatUnits(value, 18);
const message = (error) => {
  if (error.code === "ACTION_REJECTED" || error.code === 4001)
    return "Request cancelled in your wallet.";
  const name = error.revert?.name;
  const treasuryMessages = {
    NotOrganizer: "Only an authorized organizer can perform this action.",
    AlreadyApproved: "This organizer has already approved the proposal.",
    AlreadyExecuted: "This proposal has already been executed.",
    InsufficientApprovals: "Two distinct organizer approvals are required.",
    InvalidProposal: "The proposal does not exist.",
    InvalidRecipient: "The treasury rejected this recipient.",
    InvalidAmount: "Enter a positive token amount.",
  };
  if (treasuryMessages[name]) return treasuryMessages[name];
  if (name === "ERC20InsufficientAllowance")
    return "This account does not have enough allowance to spend these tokens. Ask the token owner to approve it first.";
  if (name === "ERC20InsufficientBalance")
    return "The token owner does not have enough CLUB42 for this transfer.";
  if (
    [
      "ERC20InvalidSender",
      "ERC20InvalidReceiver",
      "ERC20InvalidApprover",
      "ERC20InvalidSpender",
    ].includes(name)
  )
    return "The contract rejected an invalid account address.";
  return error.shortMessage || error.message || "Request failed.";
};
function App() {
  const [wallets, setWallets] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [account, setAccount] = useState("");
  const [chain, setChain] = useState("");
  const [balance, setBalance] = useState(null);
  const [supply, setSupply] = useState(null);
  const [notice, updateNotice] = useState(
    "Connect MetaMask to view your member balance.",
  );
  const [noticeIsError, setNoticeIsError] = useState(false);
  function setNotice(text) {
    updateNotice(text);
    setNoticeIsError(false);
  }
  function setErrorNotice(text) {
    updateNotice(text);
    setNoticeIsError(true);
  }
  const [pending, setPending] = useState(false);
  const [hash, setHash] = useState("");
  const [treasuryRevision, setTreasuryRevision] = useState(0);
  const [mode, setMode] = useState("transfer");
  const [route, setRoute] = useState(
    window.location.pathname.replace(/\/$/, "") || "/",
  );
  const isDeploy = route === "/deploy";
  const isStudy = route === "/documentation" || route === "/correction";
  useEffect(() => {
    const changed = () => {
      if (locked.current) {
        window.history.pushState({}, "", route);
        return;
      }
      setRoute(window.location.pathname.replace(/\/$/, "") || "/");
    };
    window.addEventListener("popstate", changed);
    return () => window.removeEventListener("popstate", changed);
  }, [route]);
  function navigate(event, path) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (locked.current) return;
    window.history.pushState({}, "", path);
    setRoute(path);
  }
  const [to, setTo] = useState("");
  const [owner, setOwner] = useState("");
  const [amount, setAmount] = useState("");
  const [allowance, setAllowance] = useState("");
  // Ignore results from reads started before a wallet/account/network change.
  const revision = useRef(0);
  const locked = useRef(false);
  useEffect(() => {
    const announce = (event) =>
      setWallets((list) =>
        list.some((p) => p.info.uuid === event.detail.info.uuid)
          ? list
          : [...list, event.detail],
      );
    window.addEventListener("eip6963:announceProvider", announce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () =>
      window.removeEventListener("eip6963:announceProvider", announce);
  }, []);
  async function refresh(target = wallet) {
    if (!target) return;
    const version = ++revision.current;
    const [accounts, network] = await Promise.all([
      target.request({ method: "eth_accounts" }),
      target.request({ method: "eth_chainId" }),
    ]);
    if (version !== revision.current) return;
    setAccount(accounts[0] || "");
    setChain(network);
    setBalance(null);
    setSupply(null);
    setAllowance("");
    if (!accounts.length || network !== CHAIN || isStudy) return;
    const provider = new ethers.BrowserProvider(target);
    const contract = new ethers.Contract(
      deployment.contractAddress,
      ABI,
      provider,
    );
    const [nextBalance, nextSupply] = await Promise.all([
      contract.balanceOf(accounts[0]),
      contract.totalSupply(),
    ]);
    if (version === revision.current) {
      setBalance(nextBalance);
      setSupply(nextSupply);
    }
  }
  useEffect(() => {
    if (!wallet) return;
    const changed = () => {
      revision.current++;
      setBalance(null);
      setSupply(null);
      setAllowance("");
      setNotice("Wallet changed. Check the selected account and network.");
      refresh(wallet).catch((e) => setErrorNotice(message(e)));
    };
    const disconnected = () => {
      revision.current++;
      setAccount("");
      setBalance(null);
      setSupply(null);
      setNotice("Wallet disconnected. Connect again.");
    };
    wallet.on?.("accountsChanged", changed);
    wallet.on?.("chainChanged", changed);
    wallet.on?.("disconnect", disconnected);
    return () => {
      revision.current++;
      wallet.removeListener?.("accountsChanged", changed);
      wallet.removeListener?.("chainChanged", changed);
      wallet.removeListener?.("disconnect", disconnected);
    };
  }, [wallet, route]);
  async function connect() {
    try {
      const target =
        wallets.find((p) => p.info.rdns === "io.metamask")?.provider ||
        window.ethereum?.providers?.find(
          (p) => p.isMetaMask && !p.isBraveWallet,
        ) ||
        window.ethereum;
      if (!target)
        throw new Error("Enable MetaMask in this browser, then reload.");
      // A selected MetaMask account may not yet be authorized for this site.
      // Re-open account permissions when the user explicitly requests a switch.
      if (wallet)
        await target.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      await target.request({ method: "eth_requestAccounts" });
      setWallet(target);
      setNotice("Connected. Balances are read from the public contract.");
      // Effect cleanup can invalidate this initial read; the effect below refreshes too.
      await refresh(target);
    } catch (e) {
      setErrorNotice(message(e));
    }
  }
  useEffect(() => {
    if (wallet) refresh(wallet).catch((e) => setErrorNotice(message(e)));
  }, [wallet, route]);
  async function switchNetwork() {
    try {
      await wallet.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN }],
      });
    } catch (e) {
      setErrorNotice(message(e));
    }
  }
  function validAddress(value) {
    if (!ethers.isAddress(value) || value.toLowerCase() === ethers.ZeroAddress)
      throw new Error("Enter a valid, non-zero Ethereum address.");
    return ethers.getAddress(value);
  }
  async function execute(event) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    setHash("");
    let submitted = false;
    try {
      if ((await wallet.request({ method: "eth_chainId" })) !== CHAIN)
        throw new Error("Switch to Sepolia first.");
      const recipient = validAddress(to.trim());
      if (!/^\d+(\.\d{1,18})?$/.test(amount.trim()))
        throw new Error("Enter a token amount with at most 18 decimal places.");
      const value = ethers.parseUnits(amount.trim(), 18);
      if (value === 0n && mode !== "approve")
        throw new Error("Enter an amount greater than zero.");
      const provider = new ethers.BrowserProvider(wallet);
      const signer = await provider.getSigner();
      if ((await signer.getAddress()).toLowerCase() !== account.toLowerCase())
        throw new Error("Account changed. Refresh before submitting.");
      const contract = new ethers.Contract(
        deployment.contractAddress,
        ABI,
        signer,
      );
      const args =
        mode === "transferFrom"
          ? [validAddress(owner.trim()), recipient, value]
          : [recipient, value];
      // Simulate first so contract rejections can be shown before wallet signing.
      await contract[mode].staticCall(...args);
      setNotice(
        "Review the account, Sepolia network, and transaction in MetaMask.",
      );
      const tx = await contract[mode](...args);
      submitted = true;
      setHash(tx.hash);
      setNotice("Transaction submitted. Waiting for confirmation…");
      await tx.wait();
      setNotice("Transaction confirmed on Sepolia.");
      await refresh();
    } catch (e) {
      setErrorNotice(
        submitted
          ? `Transaction submitted; check its explorer link before retrying. ${message(e)}`
          : message(e),
      );
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  async function treasuryAction(method, args) {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    setHash("");
    let submitted = false;
    try {
      if ((await wallet.request({ method: "eth_chainId" })) !== CHAIN)
        throw new Error("Switch to Sepolia first.");
      const signer = await new ethers.BrowserProvider(wallet).getSigner();
      if ((await signer.getAddress()).toLowerCase() !== account.toLowerCase())
        throw new Error("Account changed. Reconnect before submitting.");
      const contract = new ethers.Contract(
        treasuryRecord.contractAddress,
        TREASURY_ABI,
        signer,
      );
      await contract[method].staticCall(...args);
      setNotice(
        `Review treasury ${method} in MetaMask. Check the account and Sepolia network.`,
      );
      const tx = await contract[method](...args);
      submitted = true;
      setHash(tx.hash);
      setNotice("Treasury transaction submitted. Waiting for confirmation…");
      await tx.wait();
      setNotice("Treasury transaction confirmed on Sepolia.");
      setTreasuryRevision((n) => n + 1);
      await refresh();
    } catch (e) {
      setErrorNotice(
        submitted
          ? `Submitted; inspect the explorer link before retrying. ${message(e)}`
          : message(e),
      );
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  async function checkAllowance() {
    try {
      const version = revision.current;
      if ((await wallet.request({ method: "eth_chainId" })) !== CHAIN)
        throw new Error("Switch to Sepolia first.");
      const contract = new ethers.Contract(
        deployment.contractAddress,
        ABI,
        new ethers.BrowserProvider(wallet),
      );
      const value = await contract.allowance(
        mode === "transferFrom" ? validAddress(owner.trim()) : account,
        mode === "transferFrom" ? account : validAddress(to.trim()),
      );
      if (version === revision.current) setAllowance(`${format(value)} CLUB42`);
    } catch (e) {
      setErrorNotice(message(e));
    }
  }
  const ready = account && chain === CHAIN;
  return (
    <>
      <div className="video-background" aria-hidden="true">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          src="/bg-h264.mp4"
        />
        <div className="video-overlay" />
      </div>
      <main>
        <header>
          <a
            className="brand"
            href="/"
            onClick={(e) => navigate(e, "/")}
            aria-label="Club42 home"
          >
            <img src="/club42-logo.png" alt="Club42" />
          </a>
          <div className="connection">
            <nav className="main-nav" aria-label="Main navigation">
              {[
                ["/", "Token"],
                ["/deploy", "Deploy"],
                ["/documentation", "Documentation"],
                ["/correction", "Correction"],
              ].map(([path, label]) => (
                <a
                  key={path}
                  href={path}
                  aria-current={route === path ? "page" : undefined}
                  onClick={(e) => navigate(e, path)}
                >
                  {label}
                </a>
              ))}
            </nav>
            <span className="network">● Sepolia testnet</span>
            <button onClick={connect} disabled={pending}>
              {account
                ? `Switch account · ${short(account)}`
                : "Connect MetaMask"}
            </button>
          </div>
        </header>
        {!isStudy && (
          <section className="intro">
            <p className="eyebrow">YOUR CLUB. YOUR CREDITS.</p>
            <h1>
              A place for your
              <br />
              <em>Club42 tokens.</em>
            </h1>
            <p>
              Hold, send, and authorize club credits.
              <br />
              Every transaction stays visible on Sepolia.
            </p>
          </section>
        )}
        {account && chain !== CHAIN && (
          <aside className="warning">
            Your wallet is on another network.{" "}
            <button onClick={switchNetwork} disabled={pending}>
              Switch to Sepolia
            </button>
          </aside>
        )}
        <Suspense fallback={<p role="status">Loading page…</p>}>
          {route === "/documentation" ? (
            <Learn />
          ) : route === "/correction" ? (
            <Correction
              wallet={wallet}
              account={account}
              ready={ready}
              pending={pending}
              setPending={setPending}
              locked={locked}
              report={setNotice}
              reportError={(e) => setErrorNotice(message(e))}
              setHash={setHash}
            />
          ) : isDeploy ? (
            <Deploy
              wallet={wallet}
              account={account}
              ready={ready}
              pending={pending}
              setPending={setPending}
              locked={locked}
              report={setNotice}
              reportError={(e) => setErrorNotice(message(e))}
              setHash={setHash}
            />
          ) : (
            <section className="layout">
              <div>
                <article className="balance">
                  <div className="card-art" aria-hidden="true">
                    <video
                      className="card-video"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      src="/bg-h264.mp4"
                    />
                    <svg viewBox="0 0 800 310" preserveAspectRatio="none">
                      <defs>
                        <clipPath id="card-cut">
                          <path d="M80 0H720Q800 0 800 80V220Q800 300 720 300H460C405 300 380 230 315 230H80Q0 230 0 150V80Q0 0 80 0Z" />
                        </clipPath>
                        <filter id="card-blur">
                          <feGaussianBlur stdDeviation="42" />
                        </filter>
                      </defs>
                      <g clipPath="url(#card-cut)">
                        <path fill="#12630b" d="M0 0H800V310H0Z" />
                        <g filter="url(#card-blur)">
                          <ellipse
                            fill="#c5ff05"
                            cx="210"
                            cy="65"
                            rx="180"
                            ry="100"
                          />
                          <ellipse
                            fill="#a3e50b"
                            cx="510"
                            cy="270"
                            rx="250"
                            ry="90"
                          />
                          <ellipse
                            fill="#e3ffb0"
                            cx="90"
                            cy="230"
                            rx="75"
                            ry="110"
                          />
                          <ellipse
                            fill="#398c00"
                            cx="365"
                            cy="175"
                            rx="90"
                            ry="100"
                          />
                        </g>
                      </g>
                    </svg>
                  </div>
                  <div className="card-top">
                    <span className="card-mark" aria-hidden="true">
                      <i />
                      <i />
                    </span>
                    <div className="card-amount">
                      <h2>{balance === null ? "—" : format(balance)}</h2>
                      <p>TOTAL BALANCE · CLUB42</p>
                    </div>
                  </div>
                  <div className="card-copy">
                    <h3>Club42 Membership</h3>
                    <p>Your credits. Your control.</p>
                  </div>
                  <div className="card-bottom">
                    <span>
                      {account ? short(account) : "Wallet not connected"}
                    </span>
                    <button
                      className="card-refresh"
                      aria-label="Refresh balance"
                      title="Refresh balance"
                      disabled={!ready || pending}
                      onClick={() =>
                        refresh().catch((e) => setErrorNotice(message(e)))
                      }
                    >
                      ↻
                    </button>
                  </div>
                </article>
                <article className="details">
                  <div>
                    <span>Fixed total supply</span>
                    <strong>
                      {supply === null
                        ? "42,000"
                        : Number(format(supply)).toLocaleString("en-US")}{" "}
                      CLUB42{supply === null ? " · configured" : ""}
                    </strong>
                  </div>
                  <div>
                    <span>Token standard</span>
                    <strong>ERC-20 · 18 decimals</strong>
                  </div>
                  <div>
                    <span>Contract</span>
                    <a
                      href={`${deployment.explorer}#code`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {short(deployment.contractAddress)} ↗
                    </a>
                  </div>
                  <p>
                    Supply was created once at deployment. No administrator can
                    mint additional tokens or seize your balance.
                  </p>
                </article>
              </div>
              <article className="actions">
                <div className="tabs" role="group" aria-label="Token operation">
                  {[
                    ["transfer", "Send"],
                    ["approve", "Approve"],
                    ["transferFrom", "Spend allowance"],
                    ["treasury", "Treasury"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      className={mode === value ? "active" : ""}
                      disabled={pending}
                      onClick={() => {
                        setMode(value);
                        setAllowance("");
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {mode === "treasury" ? (
                  <Treasury
                    wallet={wallet}
                    account={account}
                    ready={ready}
                    pending={pending}
                    act={treasuryAction}
                    reportError={(e) => setErrorNotice(message(e))}
                    revision={treasuryRevision}
                  />
                ) : (
                  <>
                    <h2>
                      {mode === "transfer"
                        ? "Send club credits"
                        : mode === "approve"
                          ? "Grant spending permission"
                          : "Use an allowance"}
                    </h2>
                    <p>
                      {mode === "transfer"
                        ? "Move tokens from your wallet to another member."
                        : mode === "approve"
                          ? "This address can spend your tokens up to the amount you set. Enter 0 to revoke permission. Approval replaces the existing allowance."
                          : "Move tokens from an account that has approved your connected wallet."}
                    </p>
                    <form onSubmit={execute}>
                      <fieldset disabled={!ready || pending}>
                        {mode === "transferFrom" && (
                          <label>
                            Token owner
                            <input
                              value={owner}
                              onChange={(e) => {
                                setOwner(e.target.value);
                                setAllowance("");
                              }}
                              placeholder="0x…"
                              required
                              spellCheck="false"
                            />
                          </label>
                        )}
                        <label>
                          {mode === "approve"
                            ? "Spender address"
                            : "Recipient address"}
                          <input
                            value={to}
                            onChange={(e) => {
                              setTo(e.target.value);
                              setAllowance("");
                            }}
                            placeholder="0x…"
                            required
                            spellCheck="false"
                          />
                        </label>
                        <label>
                          Amount <span>CLUB42</span>
                          <input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="100"
                            inputMode="decimal"
                            required
                          />
                        </label>
                        {mode !== "transfer" && (
                          <>
                            <button
                              type="button"
                              className="subtle"
                              onClick={checkAllowance}
                            >
                              Check current allowance
                            </button>
                            {allowance && <p>Allowance: {allowance}</p>}
                            {mode === "approve" && (
                              <p className="hint">
                                Only approve an address you trust. To change a
                                non-zero allowance, revoke it first and wait for
                                confirmation.
                              </p>
                            )}
                          </>
                        )}
                        <button className="primary" type="submit">
                          {pending
                            ? "Transaction in progress…"
                            : mode === "transfer"
                              ? "Review transfer in MetaMask →"
                              : mode === "approve"
                                ? "Review approval in MetaMask →"
                                : "Review delegated transfer →"}
                        </button>
                      </fieldset>
                    </form>
                    <p className="hint">
                      Amounts use whole tokens and decimals. Gas is paid
                      separately in SepoliaETH.
                    </p>
                  </>
                )}
                <section
                  className={`status${noticeIsError ? " status-error" : ""}`}
                  role={noticeIsError ? "alert" : "status"}
                  aria-live={noticeIsError ? "assertive" : "polite"}
                >
                  <span className="eyebrow">WALLET ACTIVITY</span>
                  <p>
                    {noticeIsError && <strong>Error: </strong>}
                    {notice}
                  </p>
                  {hash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${hash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View transaction ↗
                    </a>
                  )}
                </section>
              </article>
            </section>
          )}
        </Suspense>
        {(isDeploy || route === "/correction") && (
          <section
            className={`status${noticeIsError ? " status-error" : ""}`}
            role={noticeIsError ? "alert" : "status"}
          >
            <p>{notice}</p>
            {hash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
              >
                View transaction ↗
              </a>
            )}
          </section>
        )}
      </main>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
