// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Club42 internal club credits
/// @notice Fixed supply. Holders control transfers; there is no administrator minting or seizure.
contract Club42 is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 42_000 * 10 ** 18;

    /// @notice Assign the reserve to the deployer for initial member distribution.
    constructor() ERC20("Club42", "CLUB42") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
