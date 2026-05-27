// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Standard ERC-4626 vault for testing. Simulate yield by transferring assets into the vault.
contract MockERC4626 is ERC4626 {
    constructor(IERC20 assetToken) ERC20("Mock Euler Vault", "mEV") ERC4626(assetToken) {}
}
