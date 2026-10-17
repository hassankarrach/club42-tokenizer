import { hashBlock, meetsTarget } from "./blockchainDemo.mjs";

// Run proof-of-work off the UI thread. Terminating this worker cancels the job.
self.onmessage = ({ data: { block, previous } }) => {
  for (let nonce = 0; nonce < Number.MAX_SAFE_INTEGER; nonce++) {
    const hash = hashBlock({ ...block, nonce: String(nonce) }, previous);
    if (meetsTarget(hash)) {
      self.postMessage({ type: "found", nonce: String(nonce), hash });
      return;
    }
    if (nonce % 4096 === 0) self.postMessage({ type: "progress", nonce });
  }
  self.postMessage({
    type: "error",
    message: "Nonce search exhausted. Change the data and try again.",
  });
};
