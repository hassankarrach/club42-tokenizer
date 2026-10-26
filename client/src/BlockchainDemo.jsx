import React, { useEffect, useRef, useState } from "react";
import {
  calculateChain,
  createBlock,
  createChain,
  hashBlock,
  hashText,
  meetsTarget,
} from "./blockchainDemo.mjs";
import "./blockchain-demo.css";

const tabs = [
  ["hash", "Hash"],
  ["block", "Block"],
  ["blockchain", "Blockchain"],
];
function Field({ label, id, children }) {
  return (
    <div className="pow-field">
      <label htmlFor={id}>{label}:</label>
      <div>{children}</div>
    </div>
  );
}
function BlockPanel({ block, index, chained, busy, mining, update, mine }) {
  const id = `pow-${chained ? "chain" : "block"}-${index}`;
  return (
    <article
      className={`pow-well ${block.valid ? "pow-valid" : "pow-invalid"}`}
      aria-label={`${chained ? "Chain block" : "Block"} ${index + 1}`}
    >
      <Field label="Block" id={`${id}-number`}>
        <div className="pow-number">
          <span>#</span>
          <input
            id={`${id}-number`}
            type="number"
            value={block.number}
            disabled={busy}
            onChange={(e) => update("number", e.target.value)}
          />
        </div>
      </Field>
      <Field label="Nonce" id={`${id}-nonce`}>
        <input
          id={`${id}-nonce`}
          value={block.nonce}
          disabled={busy}
          spellCheck="false"
          onChange={(e) => update("nonce", e.target.value)}
        />
      </Field>
      <Field label="Data" id={`${id}-data`}>
        <textarea
          id={`${id}-data`}
          rows="10"
          value={block.data}
          disabled={busy}
          spellCheck="false"
          onChange={(e) => update("data", e.target.value)}
        />
      </Field>
      {chained && (
        <Field label="Prev" id={`${id}-previous`}>
          <input
            id={`${id}-previous`}
            className="pow-hash"
            readOnly
            value={block.previous}
          />
        </Field>
      )}
      <Field label="Hash" id={`${id}-hash`}>
        <input
          id={`${id}-hash`}
          className="pow-hash"
          readOnly
          value={block.hash}
        />
      </Field>
      <div className="pow-field">
        <span />
        <div>
          <button className="pow-mine" disabled={busy} onClick={mine}>
            {mining ? "Mining…" : "Mine"}
          </button>
          <span className="pow-state">
            {block.valid ? "Valid · starts with 0000" : "Invalid · needs 0000"}
          </span>
        </div>
      </div>
    </article>
  );
}
export default function BlockchainDemo() {
  const [tab, setTab] = useState("hash");
  const [text, setText] = useState("");
  const [single, setSingle] = useState(createBlock);
  const [chain, setChain] = useState(createChain);
  const [job, setJob] = useState(null);
  const [notice, setNotice] = useState(
    "Change the data to see its SHA-256 hash update immediately.",
  );
  const workerRef = useRef(null);
  useEffect(() => () => workerRef.current?.terminate(), []);
  function cancel() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setJob(null);
  }
  function select(next) {
    cancel();
    setTab(next);
    setNotice(
      next === "hash"
        ? "Change the data to see its SHA-256 hash update immediately."
        : next === "block"
          ? "Edit the block number, nonce or data, then mine for a hash starting with 0000."
          : "Edit an early block: subsequent parent hashes update automatically. Re-mine from the changed block forward. Scroll sideways to see all five blocks.",
    );
  }
  function reset() {
    cancel();
    setText("");
    setSingle(createBlock());
    setChain(createChain());
    select(tab);
  }
  const rows = calculateChain(chain);
  const singleHash = hashBlock(single);
  function mine(index) {
    if (workerRef.current) return;
    const chained = tab === "blockchain";
    try {
      const worker = new Worker(
        new URL("./mining.worker.mjs", import.meta.url),
        { type: "module" },
      );
      workerRef.current = worker;
      setJob({ index });
      setNotice(`Mining block ${index + 1}…`);
      const stop = () => {
        worker.terminate();
        workerRef.current = null;
        setJob(null);
      };
      worker.onmessage = ({ data }) => {
        if (workerRef.current !== worker) return;
        if (data.type === "progress") {
          setNotice(
            `Mining block ${index + 1} · testing nonce ${data.nonce.toLocaleString("en-US")}…`,
          );
          return;
        }
        if (data.type === "found") {
          if (chained)
            setChain((blocks) =>
              blocks.map((block, i) =>
                i === index ? { ...block, nonce: data.nonce } : block,
              ),
            );
          else setSingle((block) => ({ ...block, nonce: data.nonce }));
          setNotice(
            `Block ${index + 1} mined · nonce ${data.nonce} · hash ${data.hash}.${chained ? " Later blocks now reference this new hash; mine them in order if they are invalid." : ""}`,
          );
        } else setNotice(data.message || "Mining failed. Try again.");
        stop();
      };
      worker.onerror = () => {
        if (workerRef.current !== worker) return;
        setNotice(
          "Mining worker could not run. Reload the page and try again.",
        );
        stop();
      };
      worker.postMessage({
        block: chained ? chain[index] : single,
        previous: chained ? rows[index].previous : undefined,
      });
    } catch {
      cancel();
      setNotice(
        "This browser could not start the mining worker. Try a current browser on localhost or HTTPS.",
      );
    }
  }
  return (
    <section
      className="pow-demo"
      aria-label="Interactive blockchain demonstration"
    >
      <div className="pow-navbar">
        <strong>Blockchain Demo</strong>
        <div role="tablist" aria-label="Demo sections">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              id={`pow-tab-${value}`}
              role="tab"
              aria-selected={tab === value}
              aria-controls={`pow-panel-${value}`}
              tabIndex={tab === value ? 0 : -1}
              onKeyDown={(e) => {
                const index = tabs.findIndex(([id]) => id === value);
                const target =
                  e.key === "ArrowRight"
                    ? (index + 1) % tabs.length
                    : e.key === "ArrowLeft"
                      ? (index + tabs.length - 1) % tabs.length
                      : e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? tabs.length - 1
                          : null;
                if (target !== null) {
                  e.preventDefault();
                  select(tabs[target][0]);
                  document
                    .getElementById(`pow-tab-${tabs[target][0]}`)
                    ?.focus();
                }
              }}
              onClick={() => select(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="pow-body"
        id={`pow-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`pow-tab-${tab}`}
      >
        <h3>
          {tab === "hash"
            ? "SHA256 Hash"
            : tab === "block"
              ? "Block"
              : "Blockchain"}
        </h3>
        {tab === "hash" ? (
          <div className="pow-well">
            <Field label="Data" id="pow-hash-data">
              <textarea
                id="pow-hash-data"
                rows="10"
                value={text}
                spellCheck="false"
                onChange={(e) => setText(e.target.value)}
              />
            </Field>
            <Field label="Hash" id="pow-hash-result">
              <input
                id="pow-hash-result"
                className="pow-hash"
                readOnly
                value={hashText(text)}
              />
            </Field>
          </div>
        ) : tab === "block" ? (
          <BlockPanel
            block={{
              ...single,
              hash: singleHash,
              valid: meetsTarget(singleHash),
            }}
            index={0}
            busy={!!job}
            mining={!!job}
            update={(field, value) =>
              setSingle((block) => ({ ...block, [field]: value }))
            }
            mine={() => mine(0)}
          />
        ) : (
          <div
            className="pow-chain"
            role="region"
            aria-label="Five linked blocks; scroll horizontally"
            tabIndex="0"
          >
            {rows.map((block, index) => (
              <BlockPanel
                key={index}
                block={block}
                index={index}
                chained
                busy={!!job}
                mining={job?.index === index}
                update={(field, value) =>
                  setChain((blocks) =>
                    blocks.map((block, i) =>
                      i === index ? { ...block, [field]: value } : block,
                    ),
                  )
                }
                mine={() => mine(index)}
              />
            ))}
          </div>
        )}
        <div className="pow-toolbar">
          <button onClick={reset}>Reset demo</button>
          {job && (
            <button
              onClick={() => {
                cancel();
                setNotice(
                  "Mining cancelled. You can edit the block or mine again.",
                );
              }}
            >
              Cancel mining
            </button>
          )}
        </div>
        <p className="pow-notice" role="status" aria-live="polite">
          {notice}
        </p>
        <p className="pow-explanation">
          Green means the hash meets this demo’s four-zero proof-of-work target.
          Red means it does not. Hash links and valid local work alone do not
          establish network consensus. This simplified SHA-256/mining example is
          not Ethereum’s proof-of-stake consensus or block format.
        </p>
        <p className="pow-credit">
          Adapted from{" "}
          <a
            href="https://andersbrownworth.com/blockchain"
            target="_blank"
            rel="noreferrer"
          >
            Anders Brownworth’s Blockchain Demo ↗
          </a>{" "}
          Runs locally in your browser; no wallet, fees or
          network transactions.
        </p>
      </div>
    </section>
  );
}
