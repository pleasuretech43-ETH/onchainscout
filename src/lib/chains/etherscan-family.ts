import type { ChainConfig } from './types';

export interface EtherscanSource {
  ContractName: string;
  CompilerVersion: string;
  SourceCode: string;
  ABI: string;
  Proxy: string;
  Implementation: string;
}

export interface EtherscanTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
  functionName: string;
  gasUsed?: string;
}

export class EtherscanFamily {
  constructor(public readonly chain: ChainConfig) {}

  private get apiKey(): string {
    return process.env[this.chain.explorer.apiKeyEnv] || '';
  }

  async call<T>(params: Record<string, string>): Promise<T> {
    const search = new URLSearchParams(params);
    search.set('chainid', String(this.chain.chainId));
    if (this.apiKey) search.set('apikey', this.apiKey);
    const url = `${this.chain.explorer.apiUrl}?${search.toString()}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`[${this.chain.id}] HTTP ${r.status}`);
    const data = (await r.json()) as { status: string; message: string; result: T };
    if (data.status === '0') {
      const resultStr = typeof data.result === 'string' ? data.result : '';
      const isBenign =
        /no (transactions|records|events|result|abi|contract|source)/i.test(resultStr) ||
        /no contract found/i.test(resultStr);
      if (!isBenign) {
        throw new Error(`[${this.chain.id}] ${data.message}: ${resultStr.slice(0, 200)}`);
      }
    }
    return data.result;
  }

  async getContractSource(address: string): Promise<EtherscanSource[]> {
    return this.call<EtherscanSource[]>({
      module: 'contract',
      action: 'getsourcecode',
      address,
    });
  }

  async getContractAbi(address: string): Promise<string> {
    return this.call<string>({
      module: 'contract',
      action: 'getabi',
      address,
    });
  }

  async getTxList(address: string, page = 1, offset = 100): Promise<EtherscanTx[]> {
    return this.call<EtherscanTx[]>({
      module: 'account',
      action: 'txlist',
      address,
      startblock: '0',
      endblock: '99999999',
      page: String(page),
      offset: String(offset),
      sort: 'desc',
    });
  }

  async getInternalTxList(address: string, page = 1, offset = 100): Promise<EtherscanTx[]> {
    return this.call<EtherscanTx[]>({
      module: 'account',
      action: 'txlistinternal',
      address,
      startblock: '0',
      endblock: '99999999',
      page: String(page),
      offset: String(offset),
      sort: 'desc',
    });
  }

  async ethCall(to: string, data: string): Promise<string> {
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to, data }, 'latest'],
    };
    const r = await fetch(this.chain.rpc.http, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (!r.ok) throw new Error(`[${this.chain.id}] RPC HTTP ${r.status}`);
    const j = (await r.json()) as { result?: string; error?: { message: string } };
    if (j.error) throw new Error(`[${this.chain.id}] RPC: ${j.error.message}`);
    return j.result || '0x';
  }

  async getNativeBalance(address: string): Promise<string> {
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest'],
    };
    const r = await fetch(this.chain.rpc.http, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const j = (await r.json()) as { result?: string };
    return j.result || '0x0';
  }

  async getTransactionCount(address: string): Promise<string> {
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionCount',
      params: [address, 'latest'],
    };
    const r = await fetch(this.chain.rpc.http, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const j = (await r.json()) as { result?: string };
    return j.result || '0x0';
  }
}
