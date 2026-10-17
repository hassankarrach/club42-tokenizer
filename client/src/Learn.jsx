import React, { useState } from "react";
import BlockchainDemo from "./BlockchainDemo.jsx";
import tokenSource from "../../code/Club42.sol?raw";
import treasurySource from "../../code/Club42Treasury.sol?raw";
import subject from "../../documentation/subject-v1.1.txt?raw";

const topics = [
  [
    "ledger",
    "01",
    "A shared ledger",
    "Start with the problem",
    "A ledger records who owns what. A blockchain lets independent computers check a shared history using common rules, rather than trusting one club spreadsheet administrator.",
    "A transaction proposes a change. Nodes validate signatures and execution rules; consensus determines which valid history the network follows. A public ledger is inspectable, but a wallet address does not automatically reveal a person’s identity.",
    "Alice has 100 credits and sends Bob 10. The accepted state becomes Alice 90, Bob 10. Copying a wallet screen cannot create an accepted balance.",
    "Why can’t someone simply edit their balance?",
    "Other nodes independently execute the rules. A local edit is not an authorized state transition accepted by the network.",
  ],
  [
    "blocks",
    "02",
    "Blocks & hashes",
    "Try changing history",
    "A cryptographic hash is a deterministic fingerprint of bytes. The same input gives the same result; changing the input normally gives a very different result. Hashing is not encryption and does not hide guessable data.",
    "A block references its parent’s hash. In the demo, changing a block automatically recomputes all following parent references and hashes, usually invalidating their proof of work. Hashing reveals changes; consensus and its economic protections determine which history the network accepts.",
    "Try Hash, then Block, then Blockchain below. Edit data to change its hash. Mine to find a four-zero hash. In the five-block chain, edit an early block and re-mine each affected block in order.",
    "Can an attacker recompute all the hashes?",
    "Yes. Hash links alone do not prevent it. Network consensus, validation and finality determine whether that rewritten history is accepted.",
  ],
  [
    "consensus",
    "03",
    "Consensus & finality",
    "Agreement needs rules",
    "Ethereum uses proof of stake: validators stake ETH, propose blocks and attest to the chain. Rewards, penalties and slashing help secure agreement. It is not one vote per computer.",
    "Proof of work instead uses computational work to propose blocks. A mining/nonce demonstration illustrates that mechanism, not Ethereum’s current consensus. A transaction receipt shows inclusion; finalized blocks give stronger settlement guarantees than a single confirmation.",
    "Our UI waits for a receipt before reporting confirmation. An explorer can show later confirmations and finality independently.",
    "Does a green hash prove the network accepted a block?",
    "No. A matching hash is only one structural property. Transactions must be valid and the network’s consensus must accept the chain.",
  ],
  [
    "accounts",
    "04",
    "Wallets & Sepolia",
    "Who authorizes the change?",
    "A wallet manages signing keys and helps you authorize transactions. Your tokens are balances in contract storage; they are not files held inside MetaMask. An address identifies an account on a particular network.",
    "Sepolia is our public Ethereum test network. SepoliaETH pays test transaction fees; CLUB42 is a separate ERC-20 asset. The same address on another network can have entirely different code and balances.",
    "Sending 100 CLUB42 changes token storage. It does not send 100 ETH. You still need SepoliaETH to pay for the transaction.",
    "What happens if you lose a signing key?",
    "You lose the ability to authorize transactions from that account unless your account has a separate recovery mechanism. Club42 has no administrator recovery function.",
  ],
  [
    "gas",
    "05",
    "Transactions & gas",
    "From request to receipt",
    "A signed transaction specifies an action and fee limits. The network executes it and produces a receipt. A read-only call simulates execution without committing state; it does not authorize a later transaction.",
    "Gas measures computational work. The execution fee is gas used times effective gas price. Ethereum burns the base fee and pays the priority fee to the block proposer. A mined reverted transaction still consumes gas; its contract state changes are rolled back.",
    "A simulation can succeed and a later transaction can fail because balances, allowances or other state changed in between.",
    "Does cancelling MetaMask cost gas?",
    "Rejecting before submission creates no on-chain transaction. A submitted transaction is different: inspect its hash before retrying.",
  ],
  [
    "contracts",
    "06",
    "Contracts & deployment",
    "Source becomes an address",
    "Solidity source compiles into bytecode and an ABI. Bytecode is executed by the EVM. The ABI describes how clients encode function calls and decode returned data, events and errors.",
    "Deployment sends creation bytecode. The constructor runs once for that instance and installs runtime code at a new address. Deploying identical source again creates independent state. Explorer source verification connects published source and compiler settings to deployed bytecode; it is not a security audit.",
    "Every new Club42 instance creates its own 42,000 tokens for its deployer. Deploying again does not increase the supply of the original instance.",
    "Why must the UI change address after redeployment?",
    "A call targets a network and contract address. Keeping the old address tests the old instance, even if both instances have the same name and code.",
  ],
  [
    "erc20",
    "07",
    "ERC-20 & fixed supply",
    "One interface, many tokens",
    "ERC-20 standardizes balanceOf, totalSupply, transfer, approve, allowance and transferFrom, along with Transfer and Approval events. Metadata such as name, symbol and decimals helps interfaces display a token.",
    "Club42 inherits OpenZeppelin ERC20. Its constructor calls _mint once with 42,000 × 10¹⁸ base units. Decimals affect display, not floating-point storage. There is no external mint or burn function, privileged owner, freezing or seizure.",
    "1 CLUB42 = 1,000,000,000,000,000,000 base units. transfer moves existing units; it does not change totalSupply.",
    "Can the deployer mint more or take back your credits?",
    "No. Receiving the initial supply gives the deployer tokens, not administrator powers. The contract exposes no such privileged operations.",
  ],
  [
    "nfts",
    "08",
    "NFTs & minting",
    "From a new token ID to a recorded owner",
    "An NFT identifies an individual token rather than an interchangeable quantity. ERC-721 collections record an owner for each token ID. Identify an NFT by its network, contract address and token ID; a name or image alone is not its identity.",
    "Minting creates a token and assigns it to a recipient according to the contract’s rules. Unminted items do not necessarily belong to the contract: they may not exist yet. Public minting, fees and collection limits are implementation choices, not automatic ERC-721 features.",
    "A hypothetical collection allows 100 badges but starts with none minted. Alice mints badge #7: ownerOf(7) becomes Alice. Later she transfers that same badge to Bob: ownerOf(7) becomes Bob. The transfer changes ownership; it does not create a second NFT.",
    "How does this differ from Club42?",
    "Club42 creates all 42,000 fungible credits for the deployer immediately, then distributes them by transfer. A public-mint NFT collection can create individual IDs over time. This chapter explains the distinction; Club42 remains an ERC-20 project and does not implement NFT minting.",
  ],
  [
    "allowance",
    "09",
    "Approvals & spending",
    "Permission is not a transfer",
    "approve(spender, amount) sets how much a spender may move from the caller’s balance. It does not move tokens. transferFrom(owner, recipient, amount) uses the calling spender’s allowance.",
    "A normal finite allowance decreases when spent. approve replaces the previous value. To change an existing non-zero allowance, revoke to zero and wait before setting a new value. Only trust spenders you intend to authorize.",
    "Alice approves Bob for 25. Bob transfers 10 from Alice to Carol. Alice loses 10, Carol gains 10 and Bob’s remaining allowance is 15. Bob pays the transaction gas.",
    "After revocation, what should another delegated spend do?",
    "It should revert for insufficient allowance. Demonstrate this with a read-only simulation so you do not pay for an intentionally failing transaction.",
  ],
  [
    "treasury",
    "10",
    "Multisig & security",
    "Two people must agree",
    "Our treasury is a separate contract holding existing CLUB42. Three fixed organizers can propose distributions. Two distinct organizers must approve before an organizer can execute. Creating a proposal gives no approval.",
    "The recipient and amount are fixed. Duplicate approvals and replay are rejected. Execution marks the proposal before SafeERC20 transfers; a failed transfer reverts the mark too. There is no signer rotation, cancellation, expiry, recovery or approval withdrawal.",
    "Treasury: 1,000 → propose 100 → approve A → execution blocked → approve B → execute → treasury 900. Approved proposals do not reserve funds.",
    "What if two organizer keys are lost or compromised?",
    "Losing two keys can lock the treasury. Two compromised keys can authorize spending. Three user-controlled demo accounts do not establish independent real-world governance.",
  ],
  [
    "project",
    "11",
    "Project walkthrough",
    "Connect knowledge to evidence",
    "code/ contains contracts and tests; deployment/ contains compilation, deployment and verification materials; documentation/ explains use and limitations. client/ is an optional interface, not the token itself.",
    "npm test compiles and runs local token/treasury behavioral tests. Public deployment, explorer publication and live demonstrations are separate evidence. Review the source alongside the demonstrated behavior and the saved subject v1.1.",
    "For each session: deploy → record address → verify source → inspect state → transfer → approve → delegated spend → revoke → check rejection. Export the session evidence separately.",
    "What can an explorer prove?",
    "It can show deployed code, transaction receipts, logs and state. Published source helps inspect behavior. It does not prove the contract is safe or that its documentation is truthful.",
  ],
];
function NftExplainer() {
  return <section aria-label="What happens after minting an NFT">
    <div className="concept-flow"><span>Mint request</span><span>Contract checks rules</span><span>ID assigned to recipient</span><span>Wallet displays metadata</span></div>
    <h3>What happens after you click Mint?</h3>
    <ol>
      <li><strong>Signing and submission.</strong> The wallet requests authorization. Gas is separate from any mint price. Connecting a wallet or signing a login message alone does not create an NFT.</li>
      <li><strong>Execution.</strong> When included successfully, the mint records ownership. A typical ERC-721 mint emits Transfer from the zero address to the recipient. If it reverts, the mint’s state changes are rolled back; an included failure still uses gas.</li>
      <li><strong>Confirmation.</strong> A receipt and ownerOf(tokenId) provide evidence. Finality gives stronger settlement guarantees later. Wallets and explorers may take time to index the NFT; a missing thumbnail does not necessarily mean minting failed.</li>
      <li><strong>Display.</strong> A wallet can read tokenURI(tokenId), load JSON metadata, then fetch the image it references. Metadata may live on-chain, on IPFS or on a web server. Whether it can change or remain available depends on the contract and storage setup.</li>
      <li><strong>Later ownership.</strong> The holder may keep it, authorize an operator or transfer it, subject to its rules. Listing it for sale does not guarantee a buyer or automatically transfer it. Burning is possible only if the implementation provides a permitted path.</li>
    </ol>
    <h3>The token and the picture are different</h3>
    <p>The chain records token ownership. The picture may be stored elsewhere, and copying that picture does not transfer the token. Owning an NFT does not automatically grant copyright or exclusive access to its image.</p>
    <h3>ERC-20 credits versus an ERC-721 NFT</h3>
    <table className="nft-comparison"><thead><tr><th scope="col">Question</th><th scope="col">Club42 · ERC-20</th><th scope="col">Example collection · ERC-721</th></tr></thead><tbody>
      <tr><th scope="row">What is recorded?</th><td>A quantity per account</td><td>An owner per token ID</td></tr>
      <tr><th scope="row">What does balanceOf mean?</th><td>Credits in base units</td><td>Number of NFTs held</td></tr>
      <tr><th scope="row">When are tokens created?</th><td>All at deployment</td><td>Whenever its mint rules permit</td></tr>
      <tr><th scope="row">What moves in a transfer?</th><td>A chosen amount</td><td>A specific token ID</td></tr>
    </tbody></table>
    <p className="hint">Educational example only. Club42’s token and treasury contracts do not create NFTs.</p>
  </section>;
}
function Allowance() {
  const [spent, setSpent] = useState(false);
  const [revoked, setRevoked] = useState(false);
  return (
    <div className="lab">
      <h3>Lab · a finite allowance</h3>
      <div className="concept-flow">
        <span>
          Alice balance
          <br />
          <b>{spent ? 90 : 100}</b>
        </span>
        <span>
          Bob may spend
          <br />
          <b>{revoked ? 0 : spent ? 15 : 25}</b>
        </span>
        <span>
          Carol balance
          <br />
          <b>{spent ? 10 : 0}</b>
        </span>
      </div>
      <button disabled={spent || revoked} onClick={() => setSpent(true)}>
        Bob spends 10 → Carol
      </button>{" "}
      <button disabled={revoked} onClick={() => setRevoked(true)}>
        Alice revokes
      </button>{" "}
      <button
        onClick={() => {
          setSpent(false);
          setRevoked(false);
        }}
      >
        Reset
      </button>
      <p>
        Illustration only; no wallet or network transaction.{" "}
        {revoked &&
          "Further positive delegated spending is blocked by zero allowance."}
      </p>
    </div>
  );
}
function Gas() {
  const [units, setUnits] = useState("50000");
  const [price, setPrice] = useState("2");
  const fee = (Number(units) * Number(price)) / 1e9;
  return (
    <div className="lab">
      <h3>Lab · execution fee</h3>
      <label>
        Gas used
        <input
          type="number"
          min="0"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
        />
      </label>
      <label>
        Effective price · gwei per gas
        <input
          type="number"
          min="0"
          step="0.1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      <p>
        {Number.isFinite(fee) && fee >= 0 ? fee.toFixed(9) : "—"} ETH = gas used
        × price ÷ 10⁹. Illustration, not a live fee estimate.
      </p>
    </div>
  );
}
export default function Learn() {
  const [selected, setSelected] = useState("ledger");
  const topic = topics.find((t) => t[0] === selected);
  const index = topics.indexOf(topic);
  return (
    <section className="study-layout">
      <nav className="study-nav" aria-label="Documentation chapters">
        {topics.map((t) => (
          <button
            key={t[0]}
            aria-current={selected === t[0] ? "page" : undefined}
            className={selected === t[0] ? "active" : ""}
            onClick={() => setSelected(t[0])}
          >
            <small>{t[1]}</small>
            {t[2]}
          </button>
        ))}
      </nav>
      <article className="study-content" key={selected}>
        <p className="eyebrow">CLUB42 · REVIEWER GUIDE · {topic[1]} / {topics.length}</p>
        <h1>{topic[2]}</h1>
        {selected === "ledger" && (
          <p>
            This guide explains the blockchain concepts and implementation
            choices behind Club42. Use the examples to follow how the contracts
            work, then inspect the source and on-chain evidence.
          </p>
        )}
        <h2>{topic[3]}</h2>
        <p>{topic[4]}</p>
        <p>{topic[5]}</p>
        <aside className="example">
          <strong>Concrete example</strong>
          <p>{topic[6]}</p>
        </aside>
        {selected === "blocks" ? (
          <BlockchainDemo />
        ) : selected === "nfts" ? (
          <NftExplainer />
        ) : selected === "allowance" ? (
          <Allowance />
        ) : selected === "gas" ? (
          <Gas />
        ) : (
          <div className="concept-flow">
            {(selected === "contracts"
              ? [
                  "Solidity source",
                  "Compiler → ABI + bytecode",
                  "Signed deployment",
                  "New contract address",
                ]
              : selected === "treasury"
                ? [
                    "Propose · 0 votes",
                    "Organizer A · 1 vote",
                    "Organizer B · 2 votes",
                    "Execute once",
                  ]
                : selected === "accounts"
                  ? [
                      "Wallet signs",
                      "Sepolia executes",
                      "Contract stores balances",
                    ]
                  : [
                      "Understand the rules",
                      "Observe the state",
                      "Explain the evidence",
                    ]
            ).map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        )}
        {selected === "project" && (
          <>
            <details>
              <summary>Read the actual Club42 source</summary>
              <p>
                Inheritance provides ERC-20 behavior. INITIAL_SUPPLY uses
                integer base units. The constructor sets metadata and mints once
                to msg.sender; there is no owner role.
              </p>
              <pre className="source-code">{tokenSource}</pre>
            </details>
            <details>
              <summary>Read the actual treasury source</summary>
              <p>
                onlyOrganizer checks callers. The constructor fixes the token
                and three distinct organizers. propose stores an immutable
                distribution. approve records a distinct organizer’s vote.
                execute checks the threshold, marks execution and transfers
                safely. _pending rejects missing or executed proposals.
              </p>
              <pre className="source-code">{treasurySource}</pre>
            </details>
            <details>
              <summary>Subject v1.1 · saved text</summary>
              <pre className="source-code">{subject}</pre>
            </details>
          </>
        )}
        <details>
          <summary>Further explanation: {topic[7]}</summary>
          <p>{topic[8]}</p>
        </details>
        <div className="chapter-controls">
          <button
            disabled={!index}
            onClick={() => setSelected(topics[index - 1][0])}
          >
            ← Previous
          </button>
          <button
            disabled={index === topics.length - 1}
            onClick={() => setSelected(topics[index + 1][0])}
          >
            Next chapter →
          </button>
        </div>
        <details>
          <summary>Sources & further reading</summary>
          <ul>
            <li><a href="https://eips.ethereum.org/EIPS/eip-721" target="_blank" rel="noreferrer">ERC-721 specification</a></li>
            <li><a href="https://ethereum.org/en/nft/" target="_blank" rel="noreferrer">Ethereum NFT introduction</a></li>
            <li>
              <a
                href="https://ethereum.org/en/developers/docs/intro-to-ethereum/"
                target="_blank"
                rel="noreferrer"
              >
                Ethereum fundamentals
              </a>
            </li>
            <li>
              <a
                href="https://ethereum.org/en/developers/docs/gas/"
                target="_blank"
                rel="noreferrer"
              >
                Ethereum gas and fees
              </a>
            </li>
            <li>
              <a
                href="https://eips.ethereum.org/EIPS/eip-20"
                target="_blank"
                rel="noreferrer"
              >
                ERC-20 specification
              </a>
            </li>
            <li>
              <a
                href="https://docs.openzeppelin.com/contracts/5.x/erc20"
                target="_blank"
                rel="noreferrer"
              >
                OpenZeppelin ERC20
              </a>
            </li>
            <li>
              <a
                href="https://andersbrownworth.com/blockchain/"
                target="_blank"
                rel="noreferrer"
              >
                Anders Brownworth demo · inspiration for the hash lab
              </a>
            </li>
          </ul>
          <p>
            Project-specific statements follow code/Club42.sol and
            code/Club42Treasury.sol. The saved subject is in documentation/.
          </p>
        </details>
      </article>
    </section>
  );
}
