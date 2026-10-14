/* global ethers */
const connectButton = document.getElementById('connect');
const deployButton = document.getElementById('deploy');
const status = document.getElementById('status');
const result = document.getElementById('result');
const treasuryMode = document.documentElement.dataset.treasury === 'true';
const SEPOLIA = '0xaa36a7';
let wallet, prepared, busy = false, deployed = false;
const discovered = [];
// Discover MetaMask explicitly when Brave Wallet also supplies an injected provider.
window.addEventListener('eip6963:announceProvider', event => discovered.push(event.detail));
window.dispatchEvent(new Event('eip6963:requestProvider'));
function invalidate() { prepared = null; deployButton.disabled = true; }
async function session() {
  if (await wallet.request({ method: 'eth_chainId' }) !== SEPOLIA) throw new Error('Select Sepolia in MetaMask, then reconnect.');
  const provider = new ethers.BrowserProvider(wallet);
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}
function failure(error) { status.textContent = error.shortMessage || error.message || String(error); }
connectButton.onclick = async () => {
  if (busy || deployed) return;
  busy = true; connectButton.disabled = true; invalidate();
  try {
    if (!wallet) {
      wallet = discovered.find(p => p.info.rdns === 'io.metamask')?.provider ||
        window.ethereum?.providers?.find(p => p.isMetaMask && !p.isBraveWallet) || window.ethereum;
      if (!wallet) throw new Error('Open this page in Brave with MetaMask enabled.');
      wallet.on?.('accountsChanged', () => { invalidate(); if (!busy) status.textContent = 'Account changed. Reconnect and estimate again.'; });
      wallet.on?.('chainChanged', () => { invalidate(); if (!busy) status.textContent = 'Network changed. Select Sepolia and reconnect.'; });
    }
    await wallet.request({ method: 'eth_requestAccounts' });
    const { provider, signer, address } = await session();
    const response = await fetch(treasuryMode ? '/treasury-artifact.json' : '/artifact.json');
    if (!response.ok) throw new Error('Compiled artifact unavailable.');
    const artifact = await response.json();
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
    let args = [];
    let config;
    if (treasuryMode) {
      const response = await fetch('/treasury-config.json');
      if (!response.ok) throw new Error('Treasury configuration unavailable.');
      config = await response.json();
      if (config.requiredApprovals !== 2 || config.organizers.length !== 3 ||
          new Set(config.organizers.map(a => a.toLowerCase())).size !== 3 ||
          config.organizers.some(a => !ethers.isAddress(a) || a === ethers.ZeroAddress)) throw new Error('Invalid organizer configuration.');
      const token = new ethers.Contract(config.token, ['function symbol() view returns(string)', 'function totalSupply() view returns(uint256)'], provider);
      if (await token.symbol() !== 'CLUB42' || await token.totalSupply() !== ethers.parseUnits('42000',18)) throw new Error('Unexpected token metadata or supply.');
      args = [config.token, config.organizers];
    }
    const transaction = await factory.getDeployTransaction(...args);
    const gas = await signer.estimateGas(transaction);
    const fees = await provider.getFeeData();
    const price = fees.maxFeePerGas ?? fees.gasPrice;
    if (price === null) throw new Error('Fee estimate unavailable. Try again.');
    const balance = await provider.getBalance(address);
    const estimatedFee = gas * price;
    if (balance < estimatedFee) throw new Error('Insufficient Sepolia ETH for the current estimated deployment fee.');
    prepared = { address, artifact, args, config };
    status.textContent = `Network: Sepolia\nAccount: ${address}\nBalance: ${ethers.formatEther(balance)} SepoliaETH\nEstimated gas: ${gas}\nEstimated fee at current max gas price: ${ethers.formatEther(estimatedFee)} SepoliaETH\n\nEstimate may change. Review the final fee in MetaMask.`;
    if (config) status.textContent += `\n\nToken: ${config.token}\nRequired approvals: 2 of 3\nOrganizers:\n${config.organizers.join('\n')}\n\nNo tokens will be moved by this deployment.`;
    deployButton.disabled = false;
  } catch (error) { failure(error); }
  finally { busy = false; connectButton.disabled = deployed; }
};
deployButton.onclick = async () => {
  if (busy || !prepared || deployed) return;
  busy = true; connectButton.disabled = true; deployButton.disabled = true;
  const snapshot = prepared;
  try {
    const { signer, address } = await session();
    if (address !== snapshot.address) throw new Error('Account changed. Reconnect and estimate again.');
    status.textContent = 'Review deployment in MetaMask. Confirm only on Sepolia with the intended account.';
    const factory = new ethers.ContractFactory(snapshot.artifact.abi, snapshot.artifact.bytecode, signer);
    const token = await factory.deploy(...snapshot.args);
    const transaction = token.deploymentTransaction();
    // Once submitted, block repeat deployments even if confirmation/readback fails.
    deployed = true;
    const contractAddress = await token.getAddress();
    const link = document.createElement('a');
    link.href = `https://sepolia.etherscan.io/tx/${transaction.hash}`;
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = 'View deployment transaction on Sepolia Etherscan';
    result.replaceChildren(link);
    status.textContent = `Submitted. Waiting for confirmation…\nTransaction: ${transaction.hash}\nContract: ${contractAddress}\nSave these details; do not deploy again while waiting.`;
    const receipt = await transaction.wait();
    status.textContent = `Deployment confirmed.\nNetwork: Sepolia (11155111)\nDeployer: ${address}\nContract: ${contractAddress}\nTransaction: ${receipt.hash}\nBlock: ${receipt.blockNumber}\n\nExplorer source verification is still required.`;
    // Use the submitted transaction's provider for readback; network changes may
    // interrupt these reads, but the confirmed address/receipt remain displayed.
    if (treasuryMode) {
      if ((await token.token()).toLowerCase() !== snapshot.config.token.toLowerCase() || await token.REQUIRED_APPROVALS() !== 2n || await token.proposalCount() !== 0n) throw new Error('Unexpected treasury configuration.');
      for (let i = 0; i < 3; i++) {
        if ((await token.organizers(i)).toLowerCase() !== snapshot.config.organizers[i].toLowerCase()) throw new Error('Unexpected organizer address.');
      }
      status.textContent += '\nVerified token, three organizers, 2 approvals required, and zero proposals. Treasury deployed; funding is a separate action.';
    } else {
      const supply = await token.totalSupply();
      const balance = await token.balanceOf(address);
      if (supply !== ethers.parseUnits('42000', 18) || balance !== supply) throw new Error('Unexpected supply or deployer balance.');
      status.textContent += '\nVerified supply and deployer balance: 42,000 CLUB42';
    }
  } catch (error) {
    if (deployed) status.textContent += `\n\nFollow-up error: ${error.shortMessage || error.message}. Check the explorer before taking further action.`;
    else { invalidate(); failure(error); }
  } finally { busy = false; connectButton.disabled = deployed; }
};
