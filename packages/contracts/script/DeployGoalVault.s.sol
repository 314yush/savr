// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {GoalVault} from "../src/GoalVault.sol";

contract DeployGoalVault is Script {
    function run() external {
        address usdc = vm.envAddress("USDC_ADDRESS");
        address eulerVault = vm.envAddress("EULER_VAULT_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        vm.startBroadcast();
        new GoalVault(usdc, eulerVault, treasury, msg.sender);
        vm.stopBroadcast();
    }
}
