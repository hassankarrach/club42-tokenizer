const assert = require('node:assert/strict');
const ganache = require('ganache');
const { ethers } = require('ethers');
const tokenArtifact = require('../../artifacts/Club42.json');
const treasuryArtifact = require('../../artifacts/Club42Treasury.json');
const units = value => ethers.parseUnits(value, 18);

async function main() {
  const chain = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 5 }, chain: { hardfork: 'shanghai' } });
  try {
    const provider = new ethers.BrowserProvider(chain);
    const signers = await Promise.all([0, 1, 2, 3, 4].map(i => provider.getSigner(i)));
    const addresses = await Promise.all(signers.map(s => s.getAddress()));
    const token = await new ethers.ContractFactory(tokenArtifact.abi, tokenArtifact.bytecode, signers[0]).deploy();
    await token.waitForDeployment();
    const factory = new ethers.ContractFactory(treasuryArtifact.abi, treasuryArtifact.bytecode, signers[0]);
    // Simulate constructor failures so invalid configurations never get deployed.
    async function invalidDeployment(tokenAddress, organizers, name) {
      const tx = await factory.getDeployTransaction(tokenAddress, organizers);
      await assert.rejects(provider.call({ ...tx, from: addresses[0] }), e => {
        const data = e.data ?? e.info?.error?.data;
        return typeof data === 'string' && factory.interface.parseError(data)?.name === name;
      });
    }
    await invalidDeployment(addresses[4], addresses.slice(0, 3), 'InvalidToken');
    await invalidDeployment(await token.getAddress(), [addresses[0], addresses[0], addresses[2]], 'InvalidOrganizer');
    await invalidDeployment(await token.getAddress(), [addresses[0], ethers.ZeroAddress, addresses[2]], 'InvalidOrganizer');
    const treasury = await factory.deploy(await token.getAddress(), addresses.slice(0, 3));
    await treasury.waitForDeployment();
    const address = await treasury.getAddress();
    const second = treasury.connect(signers[1]);
    const outsider = treasury.connect(signers[3]);
    const reject = (promise, name) => assert.rejects(promise, new RegExp(name));
    const send = async promise => (await promise).wait();
    assert.equal(await treasury.REQUIRED_APPROVALS(), 2n);
    for (let i = 0; i < 3; i++) {
      assert.equal(await treasury.organizers(i), addresses[i]);
      assert.equal(await treasury.isOrganizer(addresses[i]), true);
    }
    console.log('PASS treasury configuration: fixed two-of-three, distinct non-zero organizers and contract token');

    // Anyone can deposit by transferring their own tokens; no treasury permission.
    await send(token.transfer(addresses[3], units('1000')));
    await send(token.connect(signers[3]).transfer(address, units('1000')));
    await reject(outsider.propose.staticCall(addresses[4], units('100')), 'NotOrganizer');
    await reject(treasury.propose.staticCall(ethers.ZeroAddress, 1), 'InvalidRecipient');
    await reject(treasury.propose.staticCall(address, 1), 'InvalidRecipient');
    await reject(treasury.propose.staticCall(addresses[4], 0), 'InvalidAmount');
    await reject(treasury.approve.staticCall(99), 'InvalidProposal');
    await reject(treasury.execute.staticCall(99), 'InvalidProposal');
    await send(treasury.propose(addresses[4], units('100')));
    assert.equal(await treasury.proposalCount(), 1n);
    let proposal = await treasury.proposals(0);
    assert.equal(proposal.recipient, addresses[4]);
    assert.equal(proposal.amount, units('100'));
    assert.equal(proposal.approvals, 0n); // Proposal creation grants no approval.
    await reject(outsider.approve.staticCall(0), 'NotOrganizer');
    await reject(outsider.execute.staticCall(0), 'NotOrganizer');
    await reject(treasury.execute.staticCall(0), 'InsufficientApprovals');
    await send(treasury.approve(0));
    assert.equal(await treasury.approved(0, addresses[0]), true);
    await reject(treasury.approve.staticCall(0), 'AlreadyApproved');
    await reject(treasury.execute.staticCall(0), 'InsufficientApprovals');
    await send(second.approve(0));
    assert.equal((await treasury.proposals(0)).approvals, 2n);
    console.log('PASS deposits, proposal validation, authorization, separate approvals, and duplicate/threshold protection');

    // Third organizer can execute once the other two have approved.
    await send(treasury.connect(signers[2]).execute(0));
    assert.equal(await token.balanceOf(address), units('900'));
    assert.equal(await token.balanceOf(addresses[4]), units('100'));
    assert.equal((await treasury.proposals(0)).executed, true);
    await reject(second.execute.staticCall(0), 'AlreadyExecuted');
    await reject(second.approve.staticCall(0), 'AlreadyExecuted');
    console.log('PASS exact recipient/amount transfer and replay prevention');

    // An actual mined failure must roll back the executed flag and token movement.
    await send(treasury.propose(addresses[4], units('1000')));
    await send(treasury.approve(1));
    await send(second.approve(1));
    await assert.rejects(send(treasury.execute(1, { gasLimit: 300000 })), e => e.receipt?.status === 0);
    proposal = await treasury.proposals(1);
    assert.equal(proposal.executed, false);
    assert.equal(proposal.approvals, 2n);
    assert.equal(await token.balanceOf(address), units('900'));
    assert.equal(await token.balanceOf(addresses[4]), units('100'));
    await send(token.transfer(address, units('100')));
    await send(treasury.execute(1, { gasLimit: 300000 }));
    assert.equal(await token.balanceOf(address), 0n);
    assert.equal(await token.balanceOf(addresses[4]), units('1100'));
    assert.equal(await token.totalSupply(), units('42000'));
    console.log('PASS failed-transfer rollback, retry after funding, and unchanged fixed supply');
    console.log('All local treasury checks passed. No public deployment occurred.');
  } finally { await chain.disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
