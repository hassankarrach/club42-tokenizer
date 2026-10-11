const assert = require('node:assert/strict');
const ganache = require('ganache');
const { ethers } = require('ethers');
const artifact = require('../../artifacts/Club42.json');
const units = ethers.parseUnits;

async function main() {
  // Disposable accounts exist only in this in-memory chain.
  const chain = ganache.provider({logging:{quiet:true}, wallet:{totalAccounts:3}, chain:{hardfork:'shanghai'}});
  try {
    const provider = new ethers.BrowserProvider(chain);
    const organizer = await provider.getSigner(0);
    const member = await provider.getSigner(1);
    const spender = await provider.getSigner(2);
    const [organizerAddress, memberAddress, spenderAddress] = await Promise.all([organizer.getAddress(), member.getAddress(), spender.getAddress()]);
    const token = await new ethers.ContractFactory(artifact.abi, artifact.bytecode, organizer).deploy();
    await token.waitForDeployment();
    assert.equal(await token.name(), 'Club42');
    assert.equal(await token.symbol(), 'CLUB42');
    assert.equal(await token.decimals(), 18n);
    assert.equal(await token.totalSupply(), units('42000',18));
    assert.equal(await token.balanceOf(organizerAddress), units('42000',18));
    console.log('PASS deployment: 42,000 CLUB42 assigned to organizer');

    await (await token.transfer(memberAddress, units('100',18))).wait();
    assert.equal(await token.balanceOf(organizerAddress), units('41900',18));
    assert.equal(await token.balanceOf(memberAddress), units('100',18));
    assert.equal(await token.totalSupply(), units('42000',18));
    console.log('PASS transfer: organizer 41,900; member 100; supply unchanged');

    const memberToken = token.connect(member);
    await assert.rejects(memberToken.transfer.staticCall(organizerAddress, units('101',18)), /ERC20InsufficientBalance/);
    await assert.rejects(memberToken.transfer.staticCall(ethers.ZeroAddress, units('1',18)), /ERC20InvalidReceiver/);
    assert.equal(await token.balanceOf(memberAddress), units('100',18));
    console.log('PASS rejected overspending and zero-address transfer');

    const spenderToken = token.connect(spender);
    await assert.rejects(spenderToken.transferFrom.staticCall(memberAddress, organizerAddress, units('1',18)), /ERC20InsufficientAllowance/);
    await (await memberToken.approve(spenderAddress, units('25',18))).wait();
    assert.equal(await token.allowance(memberAddress, spenderAddress), units('25',18));
    assert.equal(await token.balanceOf(memberAddress), units('100',18));
    console.log('PASS approval: permits 25 tokens; moves no tokens');

    await (await spenderToken.transferFrom(memberAddress, organizerAddress, units('10',18))).wait();
    assert.equal(await token.balanceOf(memberAddress), units('90',18));
    assert.equal(await token.balanceOf(organizerAddress), units('41910',18));
    assert.equal(await token.allowance(memberAddress, spenderAddress), units('15',18));
    await assert.rejects(spenderToken.transferFrom.staticCall(memberAddress, organizerAddress, units('16',18)), /ERC20InsufficientAllowance/);
    await (await memberToken.approve(spenderAddress, 0)).wait();
    await assert.rejects(spenderToken.transferFrom.staticCall(memberAddress, organizerAddress, units('1',18)), /ERC20InsufficientAllowance/);
    assert.equal(await token.totalSupply(), units('42000',18));
    assert.equal(artifact.abi.some(item => item.type === 'function' && item.name === 'mint'), false);
    console.log('PASS delegated spending, allowance limit, revocation, and fixed supply');
    console.log('All local Club42 checks passed. No public deployment occurred.');
  } finally {
    await chain.disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
