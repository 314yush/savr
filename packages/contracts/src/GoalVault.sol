// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "./interfaces/IERC4626.sol";

/// @title GoalVault
/// @notice Goal-based savings vault that deposits USDC into an ERC-4626 Euler vault on Base.
contract GoalVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_FEE_BPS = 2500;
    uint256 public constant MIN_DEPOSIT = 1e6; // $1 USDC
    uint256 public constant MIN_GOAL_AMOUNT = 5e6; // $5 USDC

    struct Goal {
        uint256 goalId;
        address owner;
        string name;
        uint256 targetAmount;
        uint256 deadline;
        uint256 sharesOwned;
        uint256 principalDeposited;
        bool active;
    }

    IERC20 public immutable usdc;
    IERC4626 public immutable eulerVault;
    address public treasury;

    uint256 public nextGoalId = 1;
    uint256 public feeRateBps = 1500; // 15%
    uint256 public accumulatedFees;
    uint256 public tvlCap;

    mapping(uint256 => Goal) public goals;
    mapping(address => uint256[]) public ownerGoalIds;

    event GoalCreated(uint256 indexed goalId, address indexed owner, string name, uint256 targetAmount, uint256 deadline);
    event Deposited(uint256 indexed goalId, address indexed depositor, uint256 amount, uint256 sharesMinted);
    event Withdrawn(
        uint256 indexed goalId,
        address indexed owner,
        uint256 principal,
        uint256 yieldAmount,
        uint256 feeAmount,
        uint256 netAmount
    );
    event FeeRateUpdated(uint256 newFeeRateBps);
    event ProtocolFeesClaimed(address indexed treasury, uint256 amount);
    event TvlCapUpdated(uint256 newCap);

    error GoalNotFound();
    error GoalInactive();
    error InvalidAmount();
    error InvalidDeadline();
    error InvalidFeeRate();
    error NotGoalOwner();
    error TvlCapExceeded();
    error EmptyWithdraw();

    constructor(address _usdc, address _eulerVault, address _treasury, address _owner) Ownable(_owner) {
        usdc = IERC20(_usdc);
        eulerVault = IERC4626(_eulerVault);
        treasury = _treasury;
        tvlCap = 100_000e6; // $100K pre-audit cap
    }

    function createGoal(string calldata name, uint256 targetAmount, uint256 deadline) external returns (uint256 goalId) {
        if (targetAmount < MIN_GOAL_AMOUNT) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        goalId = nextGoalId++;
        goals[goalId] = Goal({
            goalId: goalId,
            owner: msg.sender,
            name: name,
            targetAmount: targetAmount,
            deadline: deadline,
            sharesOwned: 0,
            principalDeposited: 0,
            active: true
        });

        ownerGoalIds[msg.sender].push(goalId);
        emit GoalCreated(goalId, msg.sender, name, targetAmount, deadline);
    }

    function deposit(uint256 goalId, uint256 amount) external nonReentrant {
        Goal storage goal = goals[goalId];
        if (goal.goalId == 0) revert GoalNotFound();
        if (!goal.active) revert GoalInactive();
        if (amount < MIN_DEPOSIT) revert InvalidAmount();

        _enforceTvlCap(amount);

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        usdc.forceApprove(address(eulerVault), amount);

        uint256 shares = eulerVault.deposit(amount, address(this));

        goal.sharesOwned += shares;
        goal.principalDeposited += amount;

        emit Deposited(goalId, msg.sender, amount, shares);
    }

    function withdraw(uint256 goalId) external nonReentrant returns (uint256 netAmount) {
        Goal storage goal = goals[goalId];
        if (goal.goalId == 0) revert GoalNotFound();
        if (!goal.active) revert GoalInactive();
        if (msg.sender != goal.owner) revert NotGoalOwner();
        if (goal.sharesOwned == 0) revert EmptyWithdraw();

        uint256 shares = goal.sharesOwned;
        uint256 assets = eulerVault.redeem(shares, address(this), address(this));

        uint256 principal = goal.principalDeposited;
        uint256 yieldAmount = assets > principal ? assets - principal : 0;
        uint256 feeAmount = (yieldAmount * feeRateBps) / 10_000;
        netAmount = assets - feeAmount;

        goal.sharesOwned = 0;
        goal.principalDeposited = 0;
        goal.active = false;

        if (feeAmount > 0) {
            accumulatedFees += feeAmount;
        }

        usdc.safeTransfer(goal.owner, netAmount);

        emit Withdrawn(goalId, goal.owner, principal, yieldAmount, feeAmount, netAmount);
    }

    function getGoal(uint256 goalId)
        external
        view
        returns (
            address owner,
            string memory name,
            uint256 targetAmount,
            uint256 deadline,
            uint256 sharesOwned,
            uint256 principalDeposited,
            uint256 currentValue,
            bool active
        )
    {
        Goal storage goal = goals[goalId];
        if (goal.goalId == 0) revert GoalNotFound();

        currentValue = goal.sharesOwned > 0 ? eulerVault.convertToAssets(goal.sharesOwned) : 0;

        return (
            goal.owner,
            goal.name,
            goal.targetAmount,
            goal.deadline,
            goal.sharesOwned,
            goal.principalDeposited,
            currentValue,
            goal.active
        );
    }

    function getYield(uint256 goalId) external view returns (uint256) {
        Goal storage goal = goals[goalId];
        if (goal.goalId == 0) revert GoalNotFound();
        if (goal.sharesOwned == 0) return 0;

        uint256 currentValue = eulerVault.convertToAssets(goal.sharesOwned);
        return currentValue > goal.principalDeposited ? currentValue - goal.principalDeposited : 0;
    }

    function getOwnerGoalIds(address owner) external view returns (uint256[] memory) {
        return ownerGoalIds[owner];
    }

    function totalValueLocked() public view returns (uint256) {
        uint256 shares = eulerVault.balanceOf(address(this));
        return shares > 0 ? eulerVault.convertToAssets(shares) : 0;
    }

    function setFeeRate(uint256 newFeeRateBps) external onlyOwner {
        if (newFeeRateBps > MAX_FEE_BPS) revert InvalidFeeRate();
        feeRateBps = newFeeRateBps;
        emit FeeRateUpdated(newFeeRateBps);
    }

    function setTvlCap(uint256 newCap) external onlyOwner {
        tvlCap = newCap;
        emit TvlCapUpdated(newCap);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
    }

    function claimProtocolFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        usdc.safeTransfer(treasury, amount);
        emit ProtocolFeesClaimed(treasury, amount);
    }

    function _enforceTvlCap(uint256 incomingAmount) internal view {
        if (tvlCap == 0) return;
        if (totalValueLocked() + incomingAmount > tvlCap) revert TvlCapExceeded();
    }
}
