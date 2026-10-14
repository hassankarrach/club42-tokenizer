// Bundle literal source contents for explorer verification, preserving source names.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const solc = require('solc');
const root = path.resolve(__dirname, '..');
const name = process.argv[2] || 'Club42';
assert.ok(['Club42', 'Club42Treasury'].includes(name), 'Unsupported contract');
const artifact = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/' + name + '.json'), 'utf8'));
const input = {
  language: 'Solidity',
  sources: { [name + '.sol']: { content: fs.readFileSync(path.join(root, 'code', name + '.sol'), 'utf8') } },
  settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'paris', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } }
};
function check(output) {
  for (const issue of output.errors || []) {
    if (issue.severity === 'error') throw new Error(issue.formattedMessage);
  }
  assert.equal('0x' + output.contracts[name + '.sol'][name].evm.bytecode.object, artifact.bytecode,
    'Compiled bytecode differs from the existing artifact. Investigate before verifying.');
}
assert.equal(solc.version(), artifact.compiler, 'Compiler must match the existing artifact.');
// The compiler resolves transitive imports; collect each requested source by name.
check(JSON.parse(solc.compile(JSON.stringify(input), { import: name => {
  const content = fs.readFileSync(path.join(root, 'node_modules', name), 'utf8');
  input.sources[name] = { content };
  return { contents: content };
} })));
// Recompile without an import callback to prove the upload is self-contained.
check(JSON.parse(solc.compile(JSON.stringify(input))));
const target = path.join(root, 'artifacts/' + name + '.standard-input.json');
fs.writeFileSync(target, JSON.stringify(input, null, 2));
console.log(`Created ${target}\nAll ${Object.keys(input.sources).length} sources embedded; bytecode matches the existing artifact.`);

if (name === 'Club42Treasury') {
  const { ethers } = require('ethers');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'deployment/treasury-config.json'), 'utf8'));
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'address[3]'], [config.token, config.organizers]).slice(2);
  fs.writeFileSync(path.join(root, 'artifacts/Club42Treasury.constructor-args.txt'), encoded + '\n');
  console.log('Constructor arguments: artifacts/Club42Treasury.constructor-args.txt (must match deployed configuration)');
}
