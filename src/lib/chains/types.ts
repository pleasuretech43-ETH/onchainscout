export type ChainId =
  | 'ethereum'
  | 'base'
  | 'arbitrum'
  | 'optimism'
  | 'polygon'
  | 'bnb';

export interface ChainConfig {
  id: ChainId;
  name: string;
  shortName: string;
  chainId: number;
  explorer: {
    name: string;
    apiUrl: string;
    apiKeyEnv: string;
    browserUrl: string;
  };
  rpc: {
    http: string;
    envKey: string;
  };
  native: { symbol: string; decimals: number };
}
