import type { ChainConfig, ChainId } from './types';

// Etherscan V2 unified endpoint. One URL, one API key, chainid parameter selects the chain.
// https://docs.etherscan.io/v2-migration
const V2_API_URL = 'https://api.etherscan.io/v2/api';

export const CHAINS: Record<ChainId, ChainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    shortName: 'ETH',
    chainId: 1,
    explorer: {
      name: 'Etherscan',
      apiUrl: V2_API_URL,
      apiKeyEnv: 'ETHERSCAN_API_KEY',
      browserUrl: 'https://etherscan.io',
    },
    rpc: {
      http: process.env.ETHEREUM_RPC_URL || 'https://ethereum-rpc.publicnode.com',
      envKey: 'ETHEREUM_RPC_URL',
    },
    native: { symbol: 'ETH', decimals: 18 },
  },
  base: {
    id: 'base',
    name: 'Base',
    shortName: 'Base',
    chainId: 8453,
    explorer: {
      name: 'Basescan',
      apiUrl: V2_API_URL,
      apiKeyEnv: 'ETHERSCAN_API_KEY',
      browserUrl: 'https://basescan.org',
    },
    rpc: {
      http: process.env.BASE_RPC_URL || 'https://base-rpc.publicnode.com',
      envKey: 'BASE_RPC_URL',
    },
    native: { symbol: 'ETH', decimals: 18 },
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    shortName: 'ARB',
    chainId: 42161,
    explorer: {
      name: 'Arbiscan',
      apiUrl: V2_API_URL,
      apiKeyEnv: 'ETHERSCAN_API_KEY',
      browserUrl: 'https://arbiscan.io',
    },
    rpc: {
      http: process.env.ARBITRUM_RPC_URL || 'https://arbitrum-one-rpc.publicnode.com',
      envKey: 'ARBITRUM_RPC_URL',
    },
    native: { symbol: 'ETH', decimals: 18 },
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    shortName: 'OP',
    chainId: 10,
    explorer: {
      name: 'Optimistic Etherscan',
      apiUrl: V2_API_URL,
      apiKeyEnv: 'ETHERSCAN_API_KEY',
      browserUrl: 'https://optimistic.etherscan.io',
    },
    rpc: {
      http: process.env.OPTIMISM_RPC_URL || 'https://optimism-rpc.publicnode.com',
      envKey: 'OPTIMISM_RPC_URL',
    },
    native: { symbol: 'ETH', decimals: 18 },
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    shortName: 'POLY',
    chainId: 137,
    explorer: {
      name: 'Polygonscan',
      apiUrl: V2_API_URL,
      apiKeyEnv: 'ETHERSCAN_API_KEY',
      browserUrl: 'https://polygonscan.com',
    },
    rpc: {
      http: process.env.POLYGON_RPC_URL || 'https://polygon-bor-rpc.publicnode.com',
      envKey: 'POLYGON_RPC_URL',
    },
    native: { symbol: 'POL', decimals: 18 },
  },
  bnb: {
    id: 'bnb',
    name: 'BNB Smart Chain',
    shortName: 'BNB',
    chainId: 56,
    explorer: {
      name: 'BscScan',
      apiUrl: V2_API_URL,
      apiKeyEnv: 'ETHERSCAN_API_KEY',
      browserUrl: 'https://bscscan.com',
    },
    rpc: {
      http: process.env.BSC_RPC_URL || 'https://bsc-rpc.publicnode.com',
      envKey: 'BSC_RPC_URL',
    },
    native: { symbol: 'BNB', decimals: 18 },
  },
};

export const CHAIN_LIST: ChainConfig[] = Object.values(CHAINS);
