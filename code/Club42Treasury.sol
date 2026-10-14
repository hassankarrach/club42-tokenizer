// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Holds existing CLUB42. Two of three fixed organizers approve each distribution.
contract Club42Treasury {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    uint256 public constant REQUIRED_APPROVALS = 2;
    address[3] public organizers;
    mapping(address => bool) public isOrganizer;

    struct Proposal {
        address recipient;
        uint256 amount;
        uint256 approvals;
        bool executed;
    }
    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public approved;

    error InvalidToken();
    error InvalidOrganizer();
    error NotOrganizer();
    error InvalidProposal();
    error InvalidRecipient();
    error InvalidAmount();
    error AlreadyApproved();
    error AlreadyExecuted();
    error InsufficientApprovals();

    event Proposed(uint256 indexed id, address indexed proposer, address indexed recipient, uint256 amount);
    event Approved(uint256 indexed id, address indexed organizer);
    event Executed(uint256 indexed id, address indexed executor);

    modifier onlyOrganizer() {
        if (!isOrganizer[msg.sender]) revert NotOrganizer();
        _;
    }

    constructor(address tokenAddress, address[3] memory signers) {
        if (tokenAddress.code.length == 0) revert InvalidToken();
        token = IERC20(tokenAddress);
        for (uint256 i; i < 3; ++i) {
            address signer = signers[i];
            if (signer == address(0) || isOrganizer[signer]) revert InvalidOrganizer();
            organizers[i] = signer;
            isOrganizer[signer] = true;
        }
    }

    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }

    /// @notice Proposing does not approve. Recipient and amount cannot be edited.
    function propose(address recipient, uint256 amount) external onlyOrganizer returns (uint256 id) {
        if (recipient == address(0) || recipient == address(this)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        id = proposals.length;
        proposals.push(Proposal(recipient, amount, 0, false));
        emit Proposed(id, msg.sender, recipient, amount);
    }

    function approve(uint256 id) external onlyOrganizer {
        Proposal storage proposal = _pending(id);
        if (approved[id][msg.sender]) revert AlreadyApproved();
        approved[id][msg.sender] = true;
        ++proposal.approvals;
        emit Approved(id, msg.sender);
    }

    /// @notice Only organizers execute. Mark first to prevent replay during the token call.
    /// Failed transfers revert this mark, allowing a retry after funding the treasury.
    function execute(uint256 id) external onlyOrganizer {
        Proposal storage proposal = _pending(id);
        if (proposal.approvals < REQUIRED_APPROVALS) revert InsufficientApprovals();
        proposal.executed = true;
        token.safeTransfer(proposal.recipient, proposal.amount);
        emit Executed(id, msg.sender);
    }

    function _pending(uint256 id) private view returns (Proposal storage proposal) {
        if (id >= proposals.length) revert InvalidProposal();
        proposal = proposals[id];
        if (proposal.executed) revert AlreadyExecuted();
    }
}
