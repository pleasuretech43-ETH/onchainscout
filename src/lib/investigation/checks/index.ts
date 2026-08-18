// Re-export checkers. Each lives in its own file with `confidence` and `why` populated.
export { checkVerified } from './verified';
export { checkDangerousFunctions } from './dangerous-functions';
export { checkOwnership } from './ownership';
export { checkProxyUpgradeable } from './proxy-upgradeable';
export { checkHoneypot } from './honeypot';
export { checkLiquidity } from './liquidity';
export { checkHolderConcentration } from './holder-concentration';
export { checkDeployerHistory } from './deployer-history';
export { checkContractAge } from './contract-age';

import type { CheckId } from '@/lib/investigation/types';
export type { CheckId };
