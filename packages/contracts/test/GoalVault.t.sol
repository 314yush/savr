// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GoalVault} from "../src/GoalVault.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {MockERC4626} from "../src/mocks/MockERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GoalVaultTest is Test {
    GoalVault public vault;
    MockUSDC public usdc;
    MockERC4626 public euler;

    address public owner = makeAddr("owner");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public treasury = makeAddr("treasury");

    function setUp() public {
        usdc = new MockUSDC();
        euler = new MockERC4626(IERC20(address(usdc)));
        vault = new GoalVault(address(usdc), address(euler), treasury, owner);

        usdc.mint(alice, 10_000e6);
        usdc.mint(bob, 10_000e6);
    }

    function test_createGoal() public {
        vm.prank(alice);
        uint256 goalId = vault.createGoal("Trip to Japan", 500e6, block.timestamp + 30 days);
        assertEq(goalId, 1);

        (address goalOwner,, uint256 target,,,,, bool active) = vault.getGoal(goalId);
        assertEq(goalOwner, alice);
        assertEq(target, 500e6);
        assertTrue(active);
    }

    function test_createGoal_revertsOnLowTarget() public {
        vm.prank(alice);
        vm.expectRevert(GoalVault.InvalidAmount.selector);
        vault.createGoal("Small", 4e6, block.timestamp + 30 days);
    }

    function test_createGoal_revertsOnPastDeadline() public {
        vm.prank(alice);
        vm.expectRevert(GoalVault.InvalidDeadline.selector);
        vault.createGoal("Late", 100e6, block.timestamp - 1);
    }

    function test_deposit() public {
        vm.startPrank(alice);
        uint256 goalId = vault.createGoal("Japan", 500e6, block.timestamp + 30 days);
        usdc.approve(address(vault), 100e6);
        vault.deposit(goalId, 100e6);
        vm.stopPrank();

        (,,,, uint256 shares, uint256 principal, uint256 currentValue,) = vault.getGoal(goalId);
        assertGt(shares, 0);
        assertEq(principal, 100e6);
        assertEq(currentValue, 100e6);
    }

    function test_deposit_friendFunding() public {
        vm.prank(alice);
        uint256 goalId = vault.createGoal("Japan", 500e6, block.timestamp + 30 days);

        vm.startPrank(bob);
        usdc.approve(address(vault), 50e6);
        vault.deposit(goalId, 50e6);
        vm.stopPrank();

        (,,,,, uint256 principal,,) = vault.getGoal(goalId);
        assertEq(principal, 50e6);
    }

    function test_deposit_revertsBelowMinimum() public {
        vm.startPrank(alice);
        uint256 goalId = vault.createGoal("Japan", 500e6, block.timestamp + 30 days);
        usdc.approve(address(vault), 1e6);
        vm.expectRevert(GoalVault.InvalidAmount.selector);
        vault.deposit(goalId, 0.5e6);
        vm.stopPrank();
    }

    function test_withdraw_withYieldFee() public {
        vm.startPrank(alice);
        uint256 goalId = vault.createGoal("Japan", 500e6, block.timestamp + 30 days);
        usdc.approve(address(vault), 100e6);
        vault.deposit(goalId, 100e6);
        vm.stopPrank();

        // Simulate 10% yield in vault
        usdc.mint(address(this), 10e6);
        usdc.transfer(address(euler), 10e6);

        uint256 balanceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        vault.withdraw(goalId);

        uint256 received = usdc.balanceOf(alice) - balanceBefore;
        // yield ~10 USDC, fee ~15% — allow 1 wei rounding from ERC4626 share math
        assertApproxEqAbs(received, 108.5e6, 2);
        assertApproxEqAbs(vault.accumulatedFees(), 1.5e6, 2);

        (,,,, uint256 shares,,, bool active) = vault.getGoal(goalId);
        assertEq(shares, 0);
        assertFalse(active);
    }

    function test_withdraw_noYieldNoFee() public {
        vm.startPrank(alice);
        uint256 goalId = vault.createGoal("Japan", 500e6, block.timestamp + 30 days);
        usdc.approve(address(vault), 100e6);
        vault.deposit(goalId, 100e6);

        uint256 balanceBefore = usdc.balanceOf(alice);
        vault.withdraw(goalId);
        vm.stopPrank();

        assertEq(usdc.balanceOf(alice) - balanceBefore, 100e6);
        assertEq(vault.accumulatedFees(), 0);
    }

    function test_getYield() public {
        vm.startPrank(alice);
        uint256 goalId = vault.createGoal("Japan", 500e6, block.timestamp + 30 days);
        usdc.approve(address(vault), 100e6);
        vault.deposit(goalId, 100e6);
        vm.stopPrank();

        assertEq(vault.getYield(goalId), 0);

        usdc.mint(address(this), 5e6);
        usdc.transfer(address(euler), 5e6);

        assertApproxEqAbs(vault.getYield(goalId), 5e6, 2);
    }

    function test_setFeeRate() public {
        vm.prank(owner);
        vault.setFeeRate(2000);
        assertEq(vault.feeRateBps(), 2000);
    }

    function test_setFeeRate_revertsAboveMax() public {
        vm.prank(owner);
        vm.expectRevert(GoalVault.InvalidFeeRate.selector);
        vault.setFeeRate(2501);
    }

    function test_claimProtocolFees() public {
        vm.startPrank(alice);
        uint256 goalId = vault.createGoal("Japan", 500e6, block.timestamp + 30 days);
        usdc.approve(address(vault), 100e6);
        vault.deposit(goalId, 100e6);
        vm.stopPrank();

        usdc.mint(address(this), 10e6);
        usdc.transfer(address(euler), 10e6);

        vm.prank(alice);
        vault.withdraw(goalId);

        vm.prank(owner);
        vault.claimProtocolFees();
        assertApproxEqAbs(usdc.balanceOf(treasury), 1.5e6, 2);
        assertEq(vault.accumulatedFees(), 0);
    }

    function test_tvlCap() public {
        vm.prank(owner);
        vault.setTvlCap(150e6);

        vm.startPrank(alice);
        uint256 goalId = vault.createGoal("Japan", 500e6, block.timestamp + 30 days);
        usdc.approve(address(vault), 200e6);
        vm.expectRevert(GoalVault.TvlCapExceeded.selector);
        vault.deposit(goalId, 200e6);
        vm.stopPrank();
    }

    function test_withdraw_onlyOwner() public {
        vm.startPrank(alice);
        uint256 goalId = vault.createGoal("Japan", 500e6, block.timestamp + 30 days);
        usdc.approve(address(vault), 100e6);
        vault.deposit(goalId, 100e6);
        vm.stopPrank();

        vm.prank(bob);
        vm.expectRevert(GoalVault.NotGoalOwner.selector);
        vault.withdraw(goalId);
    }

    function test_getOwnerGoalIds() public {
        vm.startPrank(alice);
        vault.createGoal("A", 100e6, block.timestamp + 30 days);
        vault.createGoal("B", 200e6, block.timestamp + 60 days);
        vm.stopPrank();

        uint256[] memory ids = vault.getOwnerGoalIds(alice);
        assertEq(ids.length, 2);
        assertEq(ids[0], 1);
        assertEq(ids[1], 2);
    }
}
