import React from "react";
import { ethers } from "ethers";

// Club42 function positions checked on Sepolia Etherscan (2026-10-17).
const functions = {
  totalSupply: ["readContract", 7],
  balanceOf: ["readContract", 3],
  allowance: ["readContract", 2],
  approve: ["writeContract", 1],
  transfer: ["writeContract", 2],
  transferFrom: ["writeContract", 3],
};
export default function ExplorerGuide({ token, owner, member }) {
  const deployed = ethers.isAddress(token || "");
  function link(name) {
    const [tab, index] = functions[name];
    return deployed ? (
      <a
        href={`https://sepolia.etherscan.io/address/${token}#${tab}#F${index}`}
        target="_blank"
        rel="noreferrer"
      >
        {name} ↗
      </a>
    ) : (
      <code>{name}</code>
    );
  }
  return (
    <aside
      className="explorer-test-guide"
      aria-label="Choose how to demonstrate the contract"
    >
      <h4>Choose your demonstration: app or explorer</h4>
      <p>
        Use the app’s guided buttons, or perform the same tests directly on
        Sepolia Etherscan. Both interact with the same session contract. Pick
        one interface for each transaction so you do not repeat it.
      </p>
      {deployed ? (
        <p className="external-links">
          <a
            href={`https://sepolia.etherscan.io/address/${token}#readContract`}
            target="_blank"
            rel="noreferrer"
          >
            Open Read Contract ↗
          </a>
          <a
            href={`https://sepolia.etherscan.io/address/${token}#writeContract`}
            target="_blank"
            rel="noreferrer"
          >
            Open Write Contract ↗
          </a>
        </p>
      ) : (
        <p>
          Deploy the session token first. Return to Prepare for explorer links
          to its new address.
        </p>
      )}
      <p>
        For explorer writes, connect the correct MetaMask account on Sepolia.
        Etherscan needs the contract ABI, normally recognized through source
        verification. Reads require no signing.
      </p>
      <details>
        <summary>Explorer function links and test inputs</summary>
        <p>
          Owner: <code>{owner || "the session deployer"}</code>
          <br />
          Member / spender: <code>{member || "your second account"}</code>.
          Enter arguments manually; all numeric amounts below are integer base
          units.
        </p>
        <p>
          Before testing, read {link("totalSupply")} (expect{" "}
          <code>42000000000000000000000</code>), {link("balanceOf")} for the
          owner and member (42,000 and 0 whole tokens), and {link("allowance")}{" "}
          for owner → member (0).
        </p>
        <ol>
          <li>
            As owner, {link("transfer")}: to = member, value ={" "}
            <code>100000000000000000000</code> (100).
          </li>
          <li>
            As owner, {link("approve")}: spender = member, value ={" "}
            <code>25000000000000000000</code> (25).
          </li>
          <li>
            As member, {link("transferFrom")}: from = owner, to = member, value
            = <code>10000000000000000000</code> (10).
          </li>
          <li>
            As owner, {link("approve")}: spender = member, value ={" "}
            <code>0</code> to revoke.
          </li>
          <li>
            As member, {link("transferFrom")}: from = owner, to = member, value
            = <code>1000000000000000000</code> (1). Choose{" "}
            <strong>Simulate</strong>, not Write, and expect
            ERC20InsufficientAllowance. If simulation is unavailable, use the
            app’s no-gas check or another eth_call tool.
          </li>
        </ol>
        <p>
          For the first four steps, click Write, sign and wait for a successful
          receipt. Check Transfer / Approval events and read the updated state.
          After this exact sequence on a fresh token: owner 41,890, member 110,
          allowance 0, supply 42,000.
        </p>
        <p className="explorer-guide-note">
          Function links open the selected call without filling or submitting
          it. If Etherscan changes its function order, choose the named
          function. Save external transaction hashes in Session evidence notes;
          explorer writes are not automatically logged by the app. Explorer
          indexing may lag behind confirmation.
        </p>
      </details>
    </aside>
  );
}
