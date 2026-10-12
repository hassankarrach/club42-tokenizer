// Assertions throw when actual results differ from expectations, failing the test.
const assert = require('node:assert/strict');
// Ganache provides a local blockchain; ethers handles contract interactions.
const ganache = require('ganache');
const { ethers } = require('ethers');
// npm test compiles first: this file contains the ABI and deployment bytecode.
const artifact = require('../../artifacts/Club42.json');
// Convert readable amounts into integer units: units('1', 18) = 10^18.
const units = ethers.parseUnits;

async function main() {
  // Start a fresh in-memory chain with three accounts funded with fake ETH.
  // quiet hides Ganache logs; shanghai selects its EVM execution rules.
  const chain = ganache.provider({logging:{quiet:true}, wallet:{totalAccounts:3}, chain:{hardfork:'shanghai'}});
  try {
    // Adapt Ganache's provider to ethers. Despite its name, no browser is needed:
    // requests go directly to Ganache in this process, without an HTTP server.
    const provider = new ethers.BrowserProvider(chain);
    // Signers authorize transactions using Ganache-managed test accounts.
    // organizer deploys/distributes; member owns tokens; spender uses allowances.
    const organizer = await provider.getSigner(0);
    const member = await provider.getSigner(1);
    const spender = await provider.getSigner(2);
    // Resolve the three addresses in parallel; addresses identify accounts.
    const [organizerAddress, memberAddress, spenderAddress] = await Promise.all([organizer.getAddress(), member.getAddress(), spender.getAddress()]);
    // Deploy using the organizer: the constructor assigns it the initial supply.
    // ABI describes the interface; bytecode is what Ganache's EVM executes.
    const token = await new ethers.ContractFactory(artifact.abi, artifact.bytecode, organizer).deploy();
    await token.waitForDeployment();
    // Read metadata and initial balances. ethers returns Solidity integers as
    // JavaScript BigInt values (18n means the integer 18, not 18 tokens).
    assert.equal(await token.name(), 'Club42');
    assert.equal(await token.symbol(), 'CLUB42');
    assert.equal(await token.decimals(), 18n);
    assert.equal(await token.totalSupply(), units('42000',18));
    assert.equal(await token.balanceOf(organizerAddress), units('42000',18));
    console.log('PASS deployment: 42,000 CLUB42 assigned to organizer');

    // Send 100 tokens as the organizer. The first await submits the transaction;
    // .wait() waits for its receipt before we check the updated state.
    await (await token.transfer(memberAddress, units('100',18))).wait();
    // Transfers move existing tokens: balances change, total supply does not.
    assert.equal(await token.balanceOf(organizerAddress), units('41900',18));
    assert.equal(await token.balanceOf(memberAddress), units('100',18));
    assert.equal(await token.totalSupply(), units('42000',18));
    console.log('PASS transfer: organizer 41,900; member 100; supply unchanged');

    // Same deployed contract, but subsequent operations use the member account.
    const memberToken = token.connect(member);
    // staticCall simulates execution without saving changes or mining a transaction.
    // assert.rejects checks failure; each regex checks the expected contract error.
    // The member has only 100 tokens, so sending 101 must fail.
    await assert.rejects(memberToken.transfer.staticCall(organizerAddress, units('101',18)), /ERC20InsufficientBalance/);
    // ERC-20 transfers to the zero address must also fail.
    await assert.rejects(memberToken.transfer.staticCall(ethers.ZeroAddress, units('1',18)), /ERC20InvalidReceiver/);
    assert.equal(await token.balanceOf(memberAddress), units('100',18));
    console.log('PASS rejected overspending and zero-address transfer');

    // Switch the caller to the spender, which initially has no permission.
    const spenderToken = token.connect(spender);
    await assert.rejects(spenderToken.transferFrom.staticCall(memberAddress, organizerAddress, units('1',18)), /ERC20InsufficientAllowance/);
    // The member authorizes the spender to spend 25 of the member's tokens.
    // Approval records permission; it does not transfer tokens.
    await (await memberToken.approve(spenderAddress, units('25',18))).wait();
    assert.equal(await token.allowance(memberAddress, spenderAddress), units('25',18));
    assert.equal(await token.balanceOf(memberAddress), units('100',18));
    console.log('PASS approval: permits 25 tokens; moves no tokens');

    // The spender uses permission to move 10 tokens from member to organizer.
    // Member balance becomes 90; remaining allowance becomes 25 - 10 = 15.
    await (await spenderToken.transferFrom(memberAddress, organizerAddress, units('10',18))).wait();
    assert.equal(await token.balanceOf(memberAddress), units('90',18));
    assert.equal(await token.balanceOf(organizerAddress), units('41910',18));
    assert.equal(await token.allowance(memberAddress, spenderAddress), units('15',18));
    // Even with 90 tokens available, spending 16 exceeds the allowance of 15.
    await assert.rejects(spenderToken.transferFrom.staticCall(memberAddress, organizerAddress, units('16',18)), /ERC20InsufficientAllowance/);
    // The member revokes permission by setting the allowance to zero.
    await (await memberToken.approve(spenderAddress, 0)).wait();
    // After revocation, even spending one token must fail.
    await assert.rejects(spenderToken.transferFrom.staticCall(memberAddress, organizerAddress, units('1',18)), /ERC20InsufficientAllowance/);
    // These operations preserved supply; the ABI exposes no function named mint.
    // The ABI check alone is not a general proof that a contract cannot mint.
    assert.equal(await token.totalSupply(), units('42000',18));
    assert.equal(artifact.abi.some(item => item.type === 'function' && item.name === 'mint'), false);
    console.log('PASS delegated spending, allowance limit, revocation, and fixed supply');
    console.log('All local Club42 checks passed. No public deployment occurred.');
  } finally {
    // Always shut down Ganache, including when an assertion throws.
    // No database path was configured, so this chain is not saved for later runs.
    await chain.disconnect();
  }
}
// Report unexpected errors or failed assertions and give npm a failure exit code.
main().catch(error => { console.error(error); process.exitCode = 1; });
