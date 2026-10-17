import assert from "node:assert/strict";
import { Worker } from "node:worker_threads";
import {
  calculateChain,
  createBlock,
  createChain,
  hashBlock,
  hashText,
  meetsTarget,
  ZERO_HASH,
} from "../../client/src/blockchainDemo.mjs";

assert.equal(
  hashText(""),
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
);
assert.equal(
  hashText("abc"),
  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
);
assert(meetsTarget(hashBlock(createBlock())));
assert(!meetsTarget(hashBlock({ ...createBlock(), data: "changed" })));
const original = calculateChain(createChain());
assert(original.every((block) => block.valid));
assert.equal(original[0].previous, ZERO_HASH);
assert.equal(
  original[0].hash,
  "000015783b764259d382017d91a36d206d0600e2cbb3567748f46a33fe9297cf",
);
assert.equal(
  original[4].previous,
  "0000ae8bbc96cf89c68be6e10a865cc47c6c48a9ebec3c6cad729646cefaef83",
);
const edited = createChain();
edited[1].data = "Alice pays Bob 100";
const changed = calculateChain(edited);
assert.equal(changed[0].hash, original[0].hash);
for (let i = 1; i < changed.length; i++) {
  assert.notEqual(changed[i].hash, original[i].hash);
  assert.equal(changed[i].previous, changed[i - 1].hash);
  assert.equal(changed[i].valid, false);
}

// Execute the actual browser mining worker with a Node message adapter.
async function mine(block, previous) {
  const workerURL = new URL(
    "../../client/src/mining.worker.mjs",
    import.meta.url,
  ).href;
  const worker = new Worker(
    `
    const { parentPort } = require('node:worker_threads');
    global.self = { postMessage: message => parentPort.postMessage(message) };
    import(${JSON.stringify(workerURL)}).then(() => {
      parentPort.on('message', data => self.onmessage({ data }));
      parentPort.postMessage({ type: 'ready' });
    });
  `,
    { eval: true },
  );
  try {
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Mining timed out")),
        30000,
      );
      worker.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      worker.on("message", (message) => {
        if (message.type === "ready") worker.postMessage({ block, previous });
        if (message.type === "found") {
          clearTimeout(timeout);
          resolve(message);
        }
        if (message.type === "error") {
          clearTimeout(timeout);
          reject(new Error(message.message));
        }
      });
    });
  } finally {
    await worker.terminate();
  }
}
const mined = await mine({ ...createBlock(), data: "changed" });
assert(meetsTarget(mined.hash));
assert.equal(
  mined.hash,
  hashBlock({ ...createBlock(), data: "changed", nonce: mined.nonce }),
);
for (let i = 1; i < edited.length; i++) {
  const before = calculateChain(edited);
  const result = await mine(edited[i], before[i].previous);
  edited[i].nonce = result.nonce;
  assert(calculateChain(edited)[i].valid);
}
assert(calculateChain(edited).every((block) => block.valid));
console.log(
  "PASS SHA-256 vectors, reference fixtures, downstream hash propagation, worker mining and sequential chain repair. No blockchain transactions.",
);
