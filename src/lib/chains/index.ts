import { CHAINS } from './config';
import { EtherscanFamily } from './etherscan-family';
import type { ChainId } from './types';

const adapters = new Map<ChainId, EtherscanFamily>();

export function getAdapter(id: ChainId): EtherscanFamily {
  let a = adapters.get(id);
  if (!a) {
    a = new EtherscanFamily(CHAINS[id]);
    adapters.set(id, a);
  }
  return a;
}

export function listChains() {
  return Object.values(CHAINS);
}

export { CHAINS } from './config';
export * from './types';
export { EtherscanFamily } from './etherscan-family';
