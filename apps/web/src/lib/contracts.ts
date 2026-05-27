import { base, baseSepolia } from "wagmi/chains";

export const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? baseSepolia.id);
export const chain = chainId === base.id ? base : baseSepolia;

export const GOAL_VAULT_ADDRESS = (process.env.NEXT_PUBLIC_GOAL_VAULT_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const goalVaultAbi = [
  {
    type: "function",
    name: "createGoal",
    inputs: [
      { name: "name", type: "string" },
      { name: "targetAmount", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "goalId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "goalId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ name: "goalId", type: "uint256" }],
    outputs: [{ name: "netAmount", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getGoal",
    inputs: [{ name: "goalId", type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "name", type: "string" },
      { name: "targetAmount", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "sharesOwned", type: "uint256" },
      { name: "principalDeposited", type: "uint256" },
      { name: "currentValue", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getYield",
    inputs: [{ name: "goalId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOwnerGoalIds",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextGoalId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "feeRateBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "GoalCreated",
    inputs: [
      { name: "goalId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "targetAmount", type: "uint256", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "goalId", type: "uint256", indexed: true },
      { name: "depositor", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "sharesMinted", type: "uint256", indexed: false },
    ],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;
