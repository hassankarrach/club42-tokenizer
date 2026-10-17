import { sha256, toUtf8Bytes } from "ethers";

// Match Anders Brownworth's educational demo: concatenate the displayed fields.
// This is intentionally not Ethereum block serialization.
export const ZERO_HASH = "0".repeat(64);
export const hashText = (text) => sha256(toUtf8Bytes(text)).slice(2);
export const hashBlock = (block, previous) =>
  hashText(
    `${block.number}${block.nonce}${block.data}${previous === undefined ? "" : previous}`,
  );
export const meetsTarget = (hash) => hash.startsWith("0000");
export const createBlock = () => ({ number: "1", nonce: "72608", data: "" });
export const createChain = () =>
  ["11316", "35230", "12937", "35990", "56265"].map((nonce, index) => ({
    number: String(index + 1),
    nonce,
    data: "",
  }));
export function calculateChain(blocks) {
  let previous = ZERO_HASH;
  return blocks.map((block) => {
    const hash = hashBlock(block, previous);
    const result = { ...block, previous, hash, valid: meetsTarget(hash) };
    previous = hash;
    return result;
  });
}
