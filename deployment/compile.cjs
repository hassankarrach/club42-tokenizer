const fs = require('node:fs');
const path = require('node:path');
const solc = require('solc');
const root = path.resolve(__dirname, '..');
const input = {
  language: 'Solidity',
  sources: {'Club42.sol': {content: fs.readFileSync(path.join(root, 'code/Club42.sol'), 'utf8')}},
  settings: {optimizer: {enabled: true, runs: 200}, evmVersion: 'paris', outputSelection: {'*': {'*': ['abi', 'evm.bytecode.object']}}}
};
const output = JSON.parse(solc.compile(JSON.stringify(input), {import: name => {
  try { return {contents: fs.readFileSync(path.join(root, 'node_modules', name), 'utf8')}; }
  catch { return {error: `Import not found: ${name}`}; }
}}));
for (const issue of output.errors || []) console.error(issue.formattedMessage);
if ((output.errors || []).some(issue => issue.severity === 'error')) process.exit(1);
fs.mkdirSync(path.join(root, 'artifacts'), {recursive: true});
const contract = output.contracts['Club42.sol'].Club42;
fs.writeFileSync(path.join(root, 'artifacts/Club42.json'), JSON.stringify({contractName:'Club42', compiler:solc.version(), abi:contract.abi, bytecode:'0x'+contract.evm.bytecode.object}, null, 2));
console.log('Club42 compiled successfully. Artifact: artifacts/Club42.json');
